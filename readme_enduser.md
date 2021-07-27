
# HQPWV End-User Instructions  

HQPWV is a local webserver that allows you to remotely control <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer</a> from any device on your network using a web browser.

HQPlayer 4 Desktop is required.
  
[![Demo video](https://i.vimeocdn.com/video/1198463153?mw=1200&mh=751)](https://vimeo.com/579213725 "Demo video")  
Demo video  

# Requirements    
1. <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer 4 Desktop</a>
2. MacOS or Windows 64-bit
3. A modern desktop or mobile browser, connected to your local network
   (If using Safari, it must be a recent version, circa April 2021).
  
# Setup  
1. Get the latest MacOS or Windows (unsigned) executable [here](https://github.com/zeropointnine/hqpwv/releases). Instructions for running unsigned binaries on MacOS can be found [here](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac). If running an unsigned executable is not an option, consider downloading the source code and run the application using Node.js.
2. Make sure HQPlayer Desktop is running, and that your library is populated. Verify that the "Allow control from network" button is checked.
3. Run `hqpwv-server`. Running it from the same computer as HQPlayer is recommended (It can be run on a different computer than HQPlayer, but configuration issues may arise due to firewalls blocking ports, etc).
4. If all goes well, the console output should give you a webpage url to navigate to (eg, something like`http://192.168.X.XXX:8000`).
5. Navigate to the url from any desktop or mobile browser that's on the same network as HQPlayer and HQPWV.
  
# Troubleshooting tips  
 TODO
 
# Roadmap, possible TODOs
- Consider supporting HQPlayer Embedded.
- Consider supporting older versions of Desktop Safari and Mobile Safari.
- Consider signing executables.
- ~~Allow for running HQPWV on a different machine than HQPlayer.~~ done
- Add UI for controling HQPlayer upsampling filters.
- Also: Volume control (lol).
- Filter (search) controls to the library view.
- Pagination system for extremely-large user libraries?
- Flat track listing view, with filter controls.
- Zoomed-in "now playing" view.
- Playlist shuffle.
- Saved playlists.
- Add 'metadata layer' to track number of plays and likes.
