#!/usr/bin/python
# -*- coding: utf-8 -*-
"""
@author: Nzix
"""

import os, shutil, platform, subprocess
import re, zipfile, json
import ssl

ssl._create_default_https_context = ssl._create_unverified_context

try:
    import urllib.request as urllib
except:
    import urllib

shell = lambda command, cwd = None: subprocess.Popen(command, shell = True, stdout = subprocess.PIPE, cwd = cwd).stdout.read().decode().strip()

installation = ''
possibilities = []
electron_temp = 'electron.temp.zip'
system = {'Windows': 'win32', 'Linux': 'linux', 'Darwin': 'darwin'}[platform.system()]
cli = {'win32': 'bin', 'linux': 'bin', 'darwin': 'Contents/Resources/app/bin'}
lib = {'win32': 'ffmpeg.dll', 'linux': 'libffmpeg.so', 'darwin': 'Electron.app/Contents/Frameworks/Electron Framework.framework/Versions/A/Libraries/libffmpeg.dylib'}

if system == 'win32':
    if 'PROGRAMW6432' in os.environ:
        possibilities.append(os.environ['PROGRAMW6432'])
    if 'PROGRAMFILES(X86)' in os.environ:
        possibilities.append(os.environ['PROGRAMFILES(X86)'])
    if 'PROGRAMFILES' in os.environ:
        possibilities.append(os.environ['PROGRAMFILES'])
    if 'LOCALAPPDATA' in os.environ:
        possibilities.append(os.path.join(os.environ['LOCALAPPDATA'], 'Programs'))
    possibilities = [os.path.join(path, 'Microsoft VS Code') for path in possibilities]
    where_code = shell('where code 2> nul').split('\r\n')[0]
    if where_code:
        possibilities.append(os.path.abspath(os.path.join(os.path.realpath(where_code), os.path.pardir, os.path.pardir)))
elif system == 'linux':
    which_code = shell('which code')
    if which_code:
        possibilities.append(os.path.abspath(os.path.join(os.path.realpath(which_code), os.path.pardir, os.path.pardir)))
elif system == 'darwin':
    application = '/Applications/Visual Studio Code.app'
    if os.path.exists(application):
        possibilities.append(application)

if not installation:
    possibilities = list(set(possibilities))
    for path in possibilities:
        if os.path.exists(path):
            installation = path
            break
assert installation

vscode_version = shell(('./' if system != 'win32' else '') + 'code -v --user-data-dir="."', os.path.join(installation, cli[system])).split()
print('vscode {version} {arch}'.format(version = vscode_version[0], arch = vscode_version[-1]))

try:
    with open(os.path.join(installation, 'resources', 'app', 'package.json'), 'r') as f: package_json = json.loads(f.read())
    electron_version = package_json['devDependencies']['electron']
except:
    yarnrc = urllib.urlopen('https://raw.githubusercontent.com/Microsoft/vscode/{version}/.yarnrc'.format(version = vscode_version[0])).read().decode()
    electron_version = re.search(r'target "([^"]+)"', yarnrc).group(1)
print('electron {version}'.format(version = electron_version))

urllib.urlretrieve('https://cdn.npmmirror.com/binaries/electron/v{version}/electron-v{version}-{system}-{arch}.zip'.format(version = electron_version, system = system, arch = vscode_version[-1]), electron_temp)
print('download well')

local_lib = os.path.join(installation, lib[system].replace('Electron.app', '.'))
os.remove(local_lib)

try:
    with zipfile.ZipFile(electron_temp) as z:
        with z.open(lib[system]) as src, open(local_lib, 'wb') as dst:
            shutil.copyfileobj(src, dst)
    print('replace done')
except Exception as error:
    print(error)
finally:
    if os.path.exists(electron_temp):
        os.remove(electron_temp)
        print('remove temp')
