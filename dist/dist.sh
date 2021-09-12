# Makes executables, renames and zips them.
# Must be cd'ed to dist dir.
# Do not use underscores in filenames, just dashes (because MacOS).

echo '************************************************'
echo '*** Edit filenames in script before running! ***'
echo '************************************************'

pkg ../package.json

mv hqpwv-node16-macos-x64 hqpwv-server-0-9-5-macos-x64
mv hqpwv-node14-win-x64.exe hqpwv-server-0-9-5-win-x64.exe
mv hqpwv-node16-linux-x64 hqpwv-server-0-9-5-linux-x64
mv hqpwv-node16-linux-arm64 hqpwv-server-0-9-5-linux-arm64

zip hqpwv-server-0-9-5-macos-x64.zip hqpwv-server-0-9-5-macos-x64
zip hqpwv-server-0-9-5-win-x64.zip hqpwv-server-0-9-5-win-x64.exe
zip hqpwv-server-0-9-5-linux-x64.zip hqpwv-server-0-9-5-linux-x64
zip hqpwv-server-0-9-5-linux-arm64.zip hqpwv-server-0-9-5-linux-arm64

# rm hqpwv-server-0-9-5-macos
# rm hqpwv-server-0-9-5-win.exe
# rm hqpwv-server-0-9-5-linux-x64
# rm hqpwv-server-0-9-5-linux-arm64
