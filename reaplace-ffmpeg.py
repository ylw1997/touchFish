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
import subprocess
import tempfile
import urllib.request
import zipfile
from datetime import datetime


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
        possibilities.extend(
            [
                "/Applications/Visual Studio Code.app",
                os.path.expanduser("~/Applications/Visual Studio Code.app"),
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
    command = ["codesign", "--deep", "--force", "--sign", "-", application]
    if hasattr(os, "geteuid") and os.geteuid() != 0:
        command.insert(0, "sudo")

    result = subprocess.run(command, check=False)
    if result.returncode != 0:
        raise RuntimeError(
            "codesign failed. Check that the editor is closed and retry with "
            "an account that can use sudo."
        )
    verify_result = subprocess.run(
        ["codesign", "--verify", "--deep", "--strict", application],
        check=False,
    )
    if verify_result.returncode != 0:
        raise RuntimeError("codesign verification failed.")
    print("Code signature verification succeeded.")


def restore_backup(backup_path, local_lib, backup_hash, system, installation):
    shutil.copyfile(backup_path, local_lib)
    if sha256(local_lib) != backup_hash:
        raise RuntimeError("Rollback hash verification failed.")
    if system == "darwin":
        resign_macos_app(installation)
    if sha256(local_lib) != backup_hash:
        raise RuntimeError("Rollback hash changed after signing.")


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
    electron_version = normalize_electron_version(
        package_json.get("devDependencies", {}).get("electron", "")
    )
    architecture = detect_architecture(installation, system)
    local_lib = os.path.join(installation, LOCAL_LIBS[system])

    if not os.path.exists(local_lib):
        raise RuntimeError("Installed FFmpeg library was not found at " + local_lib)

    print("Editor: {0} {1}".format(product_name, vscode_version))
    print("Electron: {0} ({1})".format(electron_version, architecture))
    print("Installation: " + installation)

    download_url = (
        "https://cdn.npmmirror.com/binaries/electron/v{version}/"
        "electron-v{version}-{system}-{arch}.zip"
    ).format(version=electron_version, system=system, arch=architecture)

    with tempfile.TemporaryDirectory(prefix="touchfish-ffmpeg-") as temp_dir:
        archive_path = os.path.join(temp_dir, "electron.zip")
        extracted_lib = os.path.join(temp_dir, os.path.basename(local_lib))
        print("Downloading the matching Electron build...")
        urllib.request.urlretrieve(download_url, archive_path)

        with zipfile.ZipFile(archive_path) as archive:
            with archive.open(ARCHIVE_LIBS[system]) as source, open(
                extracted_lib, "wb"
            ) as destination:
                shutil.copyfileobj(source, destination)

        installed_hash = sha256(local_lib)
        expected_hash = sha256(extracted_lib)
        print("Installed SHA-256: " + installed_hash)
        print("Expected  SHA-256: " + expected_hash)

        if installed_hash == expected_hash:
            print("FFmpeg is already the matching Electron build; no change needed.")
            return 0
        if args.check:
            print("FFmpeg does not match. Run the script without --check to replace it.")
            return 2
        if editor_is_running(installation, system):
            raise RuntimeError(
                "The editor is still running. Fully quit all editor windows and "
                "background processes, then retry."
            )

        backup_path = create_backup(local_lib, product_name, vscode_version)
        print("Backup: " + backup_path)

        try:
            shutil.copyfile(extracted_lib, local_lib)
            if sha256(local_lib) != expected_hash:
                raise RuntimeError("Post-installation hash verification failed.")
            if system == "darwin":
                resign_macos_app(installation)
        except Exception as replacement_error:
            print("Replacement failed; restoring the backup...")
            try:
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
