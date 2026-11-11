#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""Replace VS Code's trimmed FFmpeg library with the matching Electron build."""

import argparse
import csv
import hashlib
import json
import os
import platform
import re
import shutil
import ssl
import struct
import subprocess
import tempfile
import urllib.request
import zipfile
import zlib
from datetime import datetime

ssl_context = None
try:
    ssl_context = ssl._create_unverified_context()
except Exception:
    pass

SYSTEM_NAMES = {"Windows": "win32", "Linux": "linux", "Darwin": "darwin"}
ARCHIVE_LIBS = {
    "win32": "ffmpeg.dll",
    "linux": "libffmpeg.so",
    "darwin": (
        "Electron.app/Contents/Frameworks/Electron Framework.framework/"
        "Versions/A/Libraries/libffmpeg.dylib"
    ),
}
LOCAL_LIBS = {
    "win32": "ffmpeg.dll",
    "linux": "libffmpeg.so",
    "darwin": (
        "Contents/Frameworks/Electron Framework.framework/"
        "Versions/A/Libraries/libffmpeg.dylib"
    ),
}


def sha256(path):
    digest = hashlib.sha256()
    with open(path, "rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def unique_existing_paths(paths):
    result = []
    for path in paths:
        if path and os.path.exists(path) and path not in result:
            result.append(path)
    return result


def find_installation(system):
    if "VSCODE_INSTALLATION" in os.environ:
        override = os.path.abspath(
            os.path.expandvars(
                os.path.expanduser(os.environ["VSCODE_INSTALLATION"].strip())
            )
        )
        if not os.environ["VSCODE_INSTALLATION"].strip():
            raise RuntimeError("VSCODE_INSTALLATION is set but empty.")
        if not os.path.exists(override):
            raise RuntimeError(
                "VSCODE_INSTALLATION does not exist: {0}".format(override)
            )
        return resolve_installation_layout(override, system)

    possibilities = []

    if system == "win32":
        roots = [
            os.environ.get("PROGRAMW6432"),
            os.environ.get("PROGRAMFILES(X86)"),
            os.environ.get("PROGRAMFILES"),
        ]
        possibilities.extend(
            os.path.join(root, "Microsoft VS Code") for root in roots if root
        )
        local_app_data = os.environ.get("LOCALAPPDATA")
        if local_app_data:
            possibilities.append(
                os.path.join(local_app_data, "Programs", "Microsoft VS Code")
            )
    elif system == "linux":
        code_path = shutil.which("code")
        if code_path:
            possibilities.append(
                os.path.abspath(
                    os.path.join(os.path.realpath(code_path), os.pardir, os.pardir)
                )
            )
        possibilities.extend(["/usr/share/code", "/opt/visual-studio-code"])
    else:
        code_path = shutil.which("code")
        if code_path:
            real_path = os.path.realpath(code_path)
            cursor = real_path
            while cursor and cursor != "/":
                if cursor.endswith(".app"):
                    possibilities.append(cursor)
                    break
                cursor = os.path.dirname(cursor)

        possibilities.extend(
            [
                "/Applications/Visual Studio Code.app",
                "/Applications/Visual Studio Code - Insiders.app",
                "/Applications/Cursor.app",
                "/Applications/VSCodium.app",
                os.path.expanduser("~/Applications/Visual Studio Code.app"),
                os.path.expanduser("~/Applications/Visual Studio Code - Insiders.app"),
                os.path.expanduser("~/Applications/Cursor.app"),
                os.path.expanduser("~/Applications/VSCodium.app"),
            ]
        )

    installations = unique_existing_paths(possibilities)
    if not installations:
        raise RuntimeError(
            "Visual Studio Code installation was not found. Set "
            "VSCODE_INSTALLATION to the editor installation path and retry."
        )
    resolved_installations = [
        resolve_installation_layout(installation, system)
        for installation in installations
    ]
    for installation in resolved_installations:
        if os.path.isfile(package_path(installation, system)):
            return installation
    return resolved_installations[0]


def package_path(installation, system):
    if system == "darwin":
        return os.path.join(
            installation, "Contents", "Resources", "app", "package.json"
        )
    return os.path.join(installation, "resources", "app", "package.json")


def resolve_installation_layout(installation, system):
    if system != "win32" or os.path.isfile(package_path(installation, system)):
        return installation

    try:
        children = [
            os.path.join(installation, name)
            for name in os.listdir(installation)
        ]
    except OSError:
        return installation

    version_installations = [
        child
        for child in children
        if os.path.isfile(package_path(child, system))
        and os.path.isfile(os.path.join(child, LOCAL_LIBS[system]))
    ]
    if not version_installations:
        return installation
    return max(
        version_installations,
        key=lambda path: os.path.getmtime(package_path(path, system)),
    )


def normalize_electron_version(value):
    match = re.search(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", str(value))
    if not match:
        raise RuntimeError("Could not determine the Electron version.")
    return match.group(0)


def find_electron_version(installation, package_json):
    env_ver = os.environ.get("ELECTRON_VERSION", "").strip()
    if env_ver:
        return normalize_electron_version(env_ver)

    version_candidates = [
        installation,
        os.path.dirname(installation),
        os.path.join(installation, "Contents"),
        os.path.join(installation, "Contents", "Frameworks", "Electron Framework.framework", "Resources"),
        os.path.join(installation, "Contents", "Frameworks", "Electron Framework.framework", "Versions", "A", "Resources"),
    ]
    for check_dir in version_candidates:
        version_file = os.path.join(check_dir, "version")
        if os.path.isfile(version_file):
            try:
                with open(version_file, "r", encoding="utf-8") as f:
                    content = f.read().strip()
                    m = re.search(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", content)
                    if m:
                        return m.group(0)
            except OSError:
                pass

    dev_deps = package_json.get("devDependencies", {})
    if isinstance(dev_deps, dict) and "electron" in dev_deps:
        m = re.search(r"\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?", str(dev_deps["electron"]))
        if m:
            return m.group(0)

    vscode_version = package_json.get("version", "")
    if vscode_version:
        urls = [
            "https://raw.githubusercontent.com/Microsoft/vscode/{0}/.yarnrc".format(vscode_version),
            "https://raw.githubusercontent.com/Microsoft/vscode/{0}/package.json".format(vscode_version),
        ]
        for url in urls:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req, timeout=10) as resp:
                    text = resp.read().decode("utf-8", errors="ignore")
                    m = re.search(r'target\s+"([^"]+)"', text) or re.search(r'"electron":\s*"([^"]+)"', text)
                    if m:
                        return normalize_electron_version(m.group(1))
            except Exception:
                pass

    raise RuntimeError(
        "Could not determine the Electron version. "
        "You can specify it manually via: $env:ELECTRON_VERSION='42.10.0'"
    )


def detect_architecture(installation, system):
    cli_paths = {
        "win32": os.path.join(installation, "bin", "code.cmd"),
        "linux": os.path.join(installation, "bin", "code"),
        "darwin": os.path.join(
            installation, "Contents", "Resources", "app", "bin", "code"
        ),
    }
    cli_path = cli_paths[system]
    if os.path.exists(cli_path):
        command = (
            ["cmd", "/c", cli_path, "--version"]
            if system == "win32"
            else [cli_path, "--version"]
        )
        result = subprocess.run(
            command, capture_output=True, text=True, check=False, timeout=20
        )
        for line in reversed(result.stdout.splitlines()):
            if line.strip() in ("arm64", "x64", "ia32"):
                return line.strip()

    machine = platform.machine().lower()
    architecture_map = {
        "aarch64": "arm64",
        "arm64": "arm64",
        "amd64": "x64",
        "x86_64": "x64",
        "i386": "ia32",
        "i686": "ia32",
    }
    if machine not in architecture_map:
        raise RuntimeError("Unsupported architecture: {0}".format(machine))
    return architecture_map[machine]


def editor_is_running(installation, system):
    if system == "win32":
        executable_names = []
        try:
            executable_names = [
                name
                for name in os.listdir(installation)
                if name.lower().endswith(".exe")
                and name.lower().startswith(("code", "cursor", "vscodium"))
            ]
        except OSError:
            pass
        if not executable_names:
            executable_names = ["Code.exe"]

        for executable_name in executable_names:
            result = subprocess.run(
                [
                    "tasklist",
                    "/FI",
                    "IMAGENAME eq {0}".format(executable_name),
                    "/FO",
                    "CSV",
                    "/NH",
                ],
                capture_output=True,
                text=True,
                check=False,
            )
            if result.returncode != 0:
                raise RuntimeError(
                    "Could not check whether the editor is running: {0}".format(
                        result.stderr.strip() or "tasklist failed"
                    )
                )
            rows = csv.reader(result.stdout.splitlines())
            if any(
                row and row[0].lower() == executable_name.lower()
                for row in rows
            ):
                return True
        return False
    executable_dir = (
        os.path.join(installation, "Contents", "MacOS")
        if system == "darwin"
        else installation
    )
    result = subprocess.run(
        ["pgrep", "-f", executable_dir],
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        check=False,
    )
    return result.returncode == 0


def create_backup(local_lib, product_name, vscode_version):
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    safe_product = re.sub(r"[^0-9A-Za-z._-]+", "-", product_name).strip("-")
    backup_dir = os.path.join(
        os.path.expanduser("~"), ".touchfish", "ffmpeg-backups"
    )
    os.makedirs(backup_dir, exist_ok=True)
    backup_path = os.path.join(
        backup_dir,
        "{0}-{1}-{2}-{3}".format(
            safe_product or "vscode",
            vscode_version,
            timestamp,
            os.path.basename(local_lib),
        ),
    )
    shutil.copy2(local_lib, backup_path)
    return backup_path


def resign_macos_app(application):
    print("Re-signing the macOS app with an ad-hoc signature...")
    print("Warning: this replaces the editor's official application signature.")

    subprocess.run(
        ["xattr", "-cr", application],
        check=False,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
    )

    command = ["codesign", "--deep", "--force", "--sign", "-", application]
    if hasattr(os, "geteuid") and os.geteuid() != 0:
        command.insert(0, "sudo")

    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise RuntimeError(
            "codesign failed. Check that the editor is closed and retry with "
            "sudo (e.g. sudo python reaplace-ffmpeg.py)."
        )

    verify_result = subprocess.run(
        ["codesign", "--verify", "--deep", application],
        check=False,
    )
    if verify_result.returncode != 0:
        print("Warning: strict codesign verification returned non-zero, but ad-hoc signature was successfully applied.")
    else:
        print("Code signature verification succeeded.")


def restore_backup(backup_path, local_lib, backup_hash, system, installation):
    shutil.copyfile(backup_path, local_lib)
    if sha256(local_lib) != backup_hash:
        raise RuntimeError("Rollback hash verification failed.")
    if system == "darwin":
        resign_macos_app(installation)
    if sha256(local_lib) != backup_hash:
        raise RuntimeError("Rollback hash changed after signing.")


def try_range_extract(url, member_path, dest_path):
    headers = {"User-Agent": "Mozilla/5.0", "Accept": "*/*"}
    req_probe = urllib.request.Request(url, headers={**headers, "Range": "bytes=0-0"})
    try:
        with urllib.request.urlopen(req_probe, context=ssl_context, timeout=12) as resp:
            if resp.status != 206:
                return False
            cr = resp.headers.get("Content-Range", "")
            if "/" not in cr:
                return False
            total_size = int(cr.split("/")[-1])
    except Exception:
        return False

    def fetch_range(start, end):
        req = urllib.request.Request(url, headers={**headers, "Range": "bytes={0}-{1}".format(start, end)})
        with urllib.request.urlopen(req, context=ssl_context, timeout=30) as r:
            return r.read()

    try:
        tail_size = min(65536, total_size)
        tail = fetch_range(total_size - tail_size, total_size - 1)
        eocd_pos = tail.rfind(b"\x50\x4b\x05\x06")
        if eocd_pos == -1:
            return False

        eocd = tail[eocd_pos:eocd_pos + 20]
        disk_num, cd_disk, disk_entries, total_entries, cd_size, cd_offset = struct.unpack("<HHHHII", eocd[4:20])

        cd_data = fetch_range(cd_offset, cd_offset + cd_size - 1)

        offset = 0
        target_entry = None
        norm_target = member_path.replace("\\", "/")
        while offset < len(cd_data):
            if cd_data[offset:offset + 4] != b"\x50\x4b\x01\x02":
                break
            header = cd_data[offset:offset + 46]
            (sig, v_made, v_needed, flags, comp_method, mod_time, mod_date,
             crc32, comp_size, uncomp_size, name_len, extra_len, comment_len,
             disk_start, int_attr, ext_attr, local_header_offset) = struct.unpack("<IHHHHHHIIIHHHHHII", header)

            entry_name = cd_data[offset + 46:offset + 46 + name_len].decode("utf-8", errors="ignore").replace("\\", "/")
            if entry_name == norm_target:
                target_entry = {
                    "comp_method": comp_method,
                    "comp_size": comp_size,
                    "uncomp_size": uncomp_size,
                    "crc32": crc32,
                    "local_header_offset": local_header_offset,
                }
                break
            offset += 46 + name_len + extra_len + comment_len

        if not target_entry:
            return False

        lh_off = target_entry["local_header_offset"]
        lh_header = fetch_range(lh_off, lh_off + 29)
        sig, v_needed, flags, comp_method, mod_time, mod_date, crc32, comp_size, uncomp_size, lh_name_len, lh_extra_len = struct.unpack("<IHHHHHIIIHH", lh_header)

        data_start = lh_off + 30 + lh_name_len + lh_extra_len
        data_end = data_start + target_entry["comp_size"] - 1

        compressed_data = fetch_range(data_start, data_end)

        if target_entry["comp_method"] == 0:
            raw_data = compressed_data
        elif target_entry["comp_method"] == 8:
            raw_data = zlib.decompressobj(-15).decompress(compressed_data)
        else:
            return False

        if len(raw_data) != target_entry["uncomp_size"]:
            return False
        if (zlib.crc32(raw_data) & 0xFFFFFFFF) != target_entry["crc32"]:
            return False

        with open(dest_path, "wb") as f:
            f.write(raw_data)
        return True
    except Exception:
        return False


def get_candidate_urls(electron_version, system, architecture):
    tag_wvcus = "v{0}%2Bwvcus".format(electron_version)
    file_wvcus = "electron-v{0}%2Bwvcus-{1}-{2}.zip".format(
        electron_version, system, architecture
    )
    castlabs_direct = (
        "https://github.com/castlabs/electron-releases/releases/download/"
        "{0}/{1}".format(tag_wvcus, file_wvcus)
    )

    official_file = "electron-v{0}-{1}-{2}.zip".format(
        electron_version, system, architecture
    )

    return [
        (castlabs_direct, True),
        ("https://ghfast.top/" + castlabs_direct, True),
        ("https://ghproxy.net/" + castlabs_direct, True),
        (
            "https://cdn.npmmirror.com/binaries/electron/v{0}/{1}".format(
                electron_version, official_file
            ),
            False,
        ),
        (
            "https://github.com/electron/electron/releases/download/v{0}/{1}".format(
                electron_version, official_file
            ),
            False,
        ),
    ]


def download_library(candidate_urls, archive_lib_path, destination_path):
    for url, has_proprietary_codecs in candidate_urls:
        source_label = (
            "Castlabs EVS (supports AAC / H.264)"
            if has_proprietary_codecs
            else "Official Electron (Open Codecs)"
        )
        print("Checking build from {0}...".format(source_label))

        # 优先尝试 HTTP Range 快速单文件解压 (1-2MB，秒级下载)
        try:
            if try_range_extract(url, archive_lib_path, destination_path):
                print("Fast-extracted {0} directly via HTTP Range.".format(os.path.basename(destination_path)))
                return True, has_proprietary_codecs
        except Exception:
            pass

        # 回退至整包下载
        tmp_zip_path = None
        try:
            with tempfile.NamedTemporaryFile(suffix=".zip", delete=False) as tmp_zip:
                tmp_zip_path = tmp_zip.name
            req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
            with urllib.request.urlopen(req, context=ssl_context, timeout=60) as resp, open(tmp_zip_path, "wb") as out_f:
                shutil.copyfileobj(resp, out_f)

            with zipfile.ZipFile(tmp_zip_path) as archive:
                norm_target = archive_lib_path.replace("\\", "/")
                matched_name = None
                for name in archive.namelist():
                    if name.replace("\\", "/") == norm_target:
                        matched_name = name
                        break
                if matched_name:
                    with archive.open(matched_name) as src, open(destination_path, "wb") as dst:
                        shutil.copyfileobj(src, dst)
                    print("Downloaded and extracted {0} successfully.".format(os.path.basename(destination_path)))
                    return True, has_proprietary_codecs
        except Exception:
            continue
        finally:
            if tmp_zip_path and os.path.exists(tmp_zip_path):
                try:
                    os.remove(tmp_zip_path)
                except Exception:
                    pass

    return False, False


def main():
    parser = argparse.ArgumentParser(
        description="Install the FFmpeg library matching VS Code's Electron version."
    )
    parser.add_argument(
        "--check",
        action="store_true",
        help="compare hashes without modifying the editor",
    )
    args = parser.parse_args()

    platform_name = platform.system()
    if platform_name not in SYSTEM_NAMES:
        raise RuntimeError("Unsupported operating system: {0}".format(platform_name))
    system = SYSTEM_NAMES[platform_name]
    installation = find_installation(system)

    metadata_path = package_path(installation, system)
    if not os.path.exists(metadata_path):
        raise RuntimeError("VS Code package.json was not found at " + metadata_path)
    with open(metadata_path, "r", encoding="utf-8") as file:
        package_json = json.load(file)

    vscode_version = package_json.get("version", "unknown")
    product_name = package_json.get("productName") or package_json.get("name") or "Code"
    electron_version = find_electron_version(installation, package_json)
    architecture = detect_architecture(installation, system)
    local_lib = os.path.join(installation, LOCAL_LIBS[system])

    if not os.path.exists(local_lib):
        raise RuntimeError("Installed FFmpeg library was not found at " + local_lib)

    print("Editor: {0} {1}".format(product_name, vscode_version))
    print("Electron: {0} ({1})".format(electron_version, architecture))
    print("Installation: " + installation)

    candidates = get_candidate_urls(electron_version, system, architecture)

    with tempfile.TemporaryDirectory(prefix="touchfish-ffmpeg-") as temp_dir:
        extracted_lib = os.path.join(temp_dir, os.path.basename(local_lib))
        success, has_proprietary = download_library(
            candidates, ARCHIVE_LIBS[system], extracted_lib
        )
        if not success or not os.path.exists(extracted_lib):
            raise RuntimeError(
                "Could not download a matching FFmpeg library for Electron {0} ({1}).".format(
                    electron_version, architecture
                )
            )

        installed_hash = sha256(local_lib)
        expected_hash = sha256(extracted_lib)
        print("Installed SHA-256: " + installed_hash)
        print("Expected  SHA-256: " + expected_hash)

        if installed_hash == expected_hash:
            print("FFmpeg is already the matching build; no change needed.")
            return 0
        if args.check:
            print("FFmpeg does not match. Run the script without --check to replace it.")
            return 2

        is_running = editor_is_running(installation, system)
        if is_running:
            print("Notice: The editor is running. Attempting hot-replacement...")

        backup_path = create_backup(local_lib, product_name, vscode_version)
        print("Backup: " + backup_path)

        renamed_target = None
        try:
            try:
                shutil.copyfile(extracted_lib, local_lib)
            except PermissionError:
                if system == "win32":
                    renamed_target = local_lib + ".bak"
                    if os.path.exists(renamed_target):
                        try:
                            os.remove(renamed_target)
                        except Exception:
                            pass
                    os.rename(local_lib, renamed_target)
                    shutil.copyfile(extracted_lib, local_lib)
                else:
                    raise

            if sha256(local_lib) != expected_hash:
                raise RuntimeError("Post-installation hash verification failed.")
            if system == "darwin":
                resign_macos_app(installation)
        except Exception as replacement_error:
            print("Replacement failed; restoring the backup...")
            try:
                if renamed_target and os.path.exists(renamed_target):
                    if os.path.exists(local_lib):
                        os.remove(local_lib)
                    os.rename(renamed_target, local_lib)
                else:
                    restore_backup(
                        backup_path,
                        local_lib,
                        installed_hash,
                        system,
                        installation,
                    )
            except Exception as rollback_error:
                raise RuntimeError(
                    "Replacement failed ({0}); rollback also failed ({1}). "
                    "The original backup remains at {2}".format(
                        replacement_error,
                        rollback_error,
                        backup_path,
                    )
                ) from rollback_error
            print("Backup restoration and verification succeeded.")
            raise

        print("Replacement and hash verification succeeded.")
        if is_running:
            print(
                "Important: The editor was running during replacement. "
                "Please restart VS Code for the new media library to take effect."
            )
        else:
            print(
                "Important: editor updates may restore the bundled FFmpeg. "
                "Run this script again if audio disappears after an update."
            )
        return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, RuntimeError, subprocess.SubprocessError, zipfile.BadZipFile) as error:
        print("Error: {0}".format(error))
        raise SystemExit(1)
