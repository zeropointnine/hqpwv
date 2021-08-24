# Makes executables, renames and zips them.
# Must be cd'ed to dist dir.
# Do not use underscores in filenames, just dashes.

echo '************************************************'
echo '*** Edit filenames in script before running! ***'
echo '************************************************'

pkg ../package.json

mv hqpwv-node16-macos hqpwv-server-0-9-1-macos
mv hqpwv-node14-win.exe hqpwv-server-0-9-1-win.exe

zip hqpwv-server-0-9-1-macos.zip hqpwv-server-0-9-1-macos 
zip hqpwv-server-0-9-1-win.exe.zip hqpwv-server-0-9-1-win.exe

# rm hqpwv-node16-macos hqpwv-server-0-9-1-macos
# rm hqpwv-node14-win.exe hqpwv-server-0-9-1-win.exe
