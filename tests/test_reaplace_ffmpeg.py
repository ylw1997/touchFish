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


if __name__ == "__main__":
    unittest.main()
