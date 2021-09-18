# Makes executables, renames and zips them.
# Must be cd'ed to dist dir.
# Do not use underscores in filenames, just dashes (because MacOS).

echo '******************************************************'
echo '*** Edit version numbers in script before running! ***'
echo '******************************************************'

pkg ../package.json

mv hqpwv-node16-macos hqpwv-server-0-9-9-macos-x64
mv hqpwv-node14-win.exe hqpwv-server-0-9-9-win-x64.exe
mv hqpwv-node16-linux hqpwv-server-0-9-9-linux-x64

zip hqpwv-server-0-9-9-macos-x64.zip hqpwv-server-0-9-9-macos-x64
zip hqpwv-server-0-9-9-win-x64.zip hqpwv-server-0-9-9-win-x64.exe
zip hqpwv-server-0-9-9-linux-x64.zip hqpwv-server-0-9-9-linux-x64

# rm hqpwv-server-0-9-9-macos
# rm hqpwv-server-0-9-9-win.exe
# rm hqpwv-server-0-9-9-linux-x64
