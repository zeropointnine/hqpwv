# Makes executables, renames and zips them.
# Must be cd'ed to dist dir.
# Do not use underscores in filenames, just dashes.

echo '************************************************'
echo '*** Edit filenames in script before running! ***'
echo '************************************************'

pkg ../package.json

mv hqpwv-node16-macos hqpwv-server-0-9-3-macos
mv hqpwv-node14-win.exe hqpwv-server-0-9-3-win.exe
mv hqpwv-node16-linux hqpwv-server-0-9-3-linux.bin

zip hqpwv-server-0-9-3-macos.zip hqpwv-server-0-9-3-macos 
zip hqpwv-server-0-9-3-win.exe.zip hqpwv-server-0-9-3-win.exe
zip hqpwv-server-0-9-3-linux.exe.zip hqpwv-server-0-9-3-linux.bin

# rm hqpwv-server-0-9-3-macos
# rm hqpwv-server-0-9-3-win.exe
# rm hqpwv-server-0-9-3-linux.bin
