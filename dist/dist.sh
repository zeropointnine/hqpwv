# Makes executables, renames and zips them.
# Must be cd'ed to dist dir.
# Do not use underscores in filenames, just dashes (because MacOS).

if [ -z $1 ]; then
	echo 'Missing version string argument'
	echo "(example: ./dist.sh 0-9-0)"
    exit 1
fi

pkg ../package.json

mv hqpwv-node16-macos hqpwv-server-$1-macos-x64
mv hqpwv-node14-win.exe hqpwv-server-$1-win-x64.exe
mv hqpwv-node16-linux hqpwv-server-$1-linux-x64

zip hqpwv-server-$1-macos-x64.zip hqpwv-server-$1-macos-x64
zip hqpwv-server-$1-win-x64.zip hqpwv-server-$1-win-x64.exe
zip hqpwv-server-$1-linux-x64.zip hqpwv-server-$1-linux-x64

ls -l

# rm hqpwv-server-$1-macos
# rm hqpwv-server-$1-win.exe
# rm hqpwv-server-$1-linux-x64