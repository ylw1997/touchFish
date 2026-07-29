import importlib.util
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock


SCRIPT_PATH = Path(__file__).resolve().parents[1] / "reaplace-ffmpeg.py"
SPEC = importlib.util.spec_from_file_location("reaplace_ffmpeg", SCRIPT_PATH)
reaplace_ffmpeg = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(reaplace_ffmpeg)


class FindInstallationTests(unittest.TestCase):
    def test_invalid_explicit_installation_does_not_fall_back(self):
        with mock.patch.dict(
            os.environ,
            {"VSCODE_INSTALLATION": "/does/not/exist"},
            clear=True,
        ):
            with self.assertRaisesRegex(
                RuntimeError, "VSCODE_INSTALLATION does not exist"
            ):
                reaplace_ffmpeg.find_installation("darwin")

    def test_empty_explicit_installation_is_rejected(self):
        with mock.patch.dict(
            os.environ, {"VSCODE_INSTALLATION": "   "}, clear=True
        ):
            with self.assertRaisesRegex(RuntimeError, "set but empty"):
                reaplace_ffmpeg.find_installation("linux")

    def test_existing_explicit_installation_is_returned(self):
        with tempfile.TemporaryDirectory() as installation:
            with mock.patch.dict(
                os.environ,
                {"VSCODE_INSTALLATION": installation},
                clear=True,
            ):
                self.assertEqual(
                    reaplace_ffmpeg.find_installation("win32"),
                    installation,
                )


class EditorRunningTests(unittest.TestCase):
    def test_windows_detects_running_editor(self):
        completed = mock.Mock(
            returncode=0,
            stdout='"Code.exe","123","Console","1","100,000 K"\n',
            stderr="",
        )
        with mock.patch.object(
            reaplace_ffmpeg.os, "listdir", return_value=["Code.exe"]
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess, "run", return_value=completed
        ) as run:
            self.assertTrue(
                reaplace_ffmpeg.editor_is_running(
                    r"C:\Program Files\Microsoft VS Code", "win32"
                )
            )
        run.assert_called_once()
        self.assertIn("IMAGENAME eq Code.exe", run.call_args.args[0])

    def test_windows_reports_stopped_editor(self):
        completed = mock.Mock(
            returncode=0,
            stdout="INFO: No tasks are running which match the specified criteria.\n",
            stderr="",
        )
        with mock.patch.object(
            reaplace_ffmpeg.os, "listdir", return_value=["Code.exe"]
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess, "run", return_value=completed
        ):
            self.assertFalse(
                reaplace_ffmpeg.editor_is_running(
                    r"C:\Program Files\Microsoft VS Code", "win32"
                )
            )

    def test_windows_tasklist_failure_stops_replacement(self):
        completed = mock.Mock(returncode=1, stdout="", stderr="Access denied")
        with mock.patch.object(
            reaplace_ffmpeg.os, "listdir", return_value=["Code.exe"]
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess, "run", return_value=completed
        ):
            with self.assertRaisesRegex(RuntimeError, "Access denied"):
                reaplace_ffmpeg.editor_is_running(
                    r"C:\Program Files\Microsoft VS Code", "win32"
                )


class MacOSSigningTests(unittest.TestCase):
    def test_non_root_signing_uses_sudo_and_verifies_signature(self):
        success = mock.Mock(returncode=0)
        with mock.patch.object(
            reaplace_ffmpeg.os, "geteuid", return_value=501, create=True
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess,
            "run",
            side_effect=[success, success],
        ) as run:
            reaplace_ffmpeg.resign_macos_app(
                "/Applications/Visual Studio Code.app"
            )

        self.assertEqual(run.call_args_list[0].args[0][0], "sudo")
        self.assertEqual(
            run.call_args_list[1].args[0][:3],
            ["codesign", "--verify", "--deep"],
        )

    def test_root_signing_does_not_use_sudo(self):
        success = mock.Mock(returncode=0)
        with mock.patch.object(
            reaplace_ffmpeg.os, "geteuid", return_value=0, create=True
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess,
            "run",
            side_effect=[success, success],
        ) as run:
            reaplace_ffmpeg.resign_macos_app(
                "/Applications/Visual Studio Code.app"
            )

        self.assertEqual(run.call_args_list[0].args[0][0], "codesign")

    def test_signature_verification_failure_is_reported(self):
        success = mock.Mock(returncode=0)
        failure = mock.Mock(returncode=1)
        with mock.patch.object(
            reaplace_ffmpeg.os, "geteuid", return_value=501, create=True
        ), mock.patch.object(
            reaplace_ffmpeg.subprocess,
            "run",
            side_effect=[success, failure],
        ):
            with self.assertRaisesRegex(
                RuntimeError, "codesign verification failed"
            ):
                reaplace_ffmpeg.resign_macos_app(
                    "/Applications/Visual Studio Code.app"
                )


class RollbackTests(unittest.TestCase):
    def test_rollback_restores_hash_and_resigns_macos_app(self):
        with tempfile.TemporaryDirectory() as directory:
            backup = os.path.join(directory, "backup.dylib")
            installed = os.path.join(directory, "libffmpeg.dylib")
            with open(backup, "wb") as file:
                file.write(b"original")
            with open(installed, "wb") as file:
                file.write(b"replacement")

            with mock.patch.object(
                reaplace_ffmpeg, "resign_macos_app"
            ) as resign:
                reaplace_ffmpeg.restore_backup(
                    backup,
                    installed,
                    reaplace_ffmpeg.sha256(backup),
                    "darwin",
                    "/Applications/Visual Studio Code.app",
                )

            self.assertEqual(
                reaplace_ffmpeg.sha256(installed),
                reaplace_ffmpeg.sha256(backup),
            )
            resign.assert_called_once_with(
                "/Applications/Visual Studio Code.app"
            )

    def test_rollback_hash_mismatch_is_reported(self):
        with tempfile.TemporaryDirectory() as directory:
            backup = os.path.join(directory, "backup.dll")
            installed = os.path.join(directory, "ffmpeg.dll")
            with open(backup, "wb") as file:
                file.write(b"original")
            with open(installed, "wb") as file:
                file.write(b"replacement")

            with self.assertRaisesRegex(
                RuntimeError, "Rollback hash verification failed"
            ):
                reaplace_ffmpeg.restore_backup(
                    backup,
                    installed,
                    "not-the-original-hash",
                    "win32",
                    r"C:\Program Files\Microsoft VS Code",
                )


if __name__ == "__main__":
    unittest.main()
