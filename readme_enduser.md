
# HQPWV End-User Instructions  

HQPWV is a local webserver that allows you to remotely control <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer</a> from any device on your network using a web browser.

HQPlayer 4 Desktop is required.
  
[![Demo video](https://i.vimeocdn.com/video/1198463153?mw=1200&mh=751)](https://vimeo.com/579213725 "Demo video")  
Demo video  

# Requirements    
1. <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer 4 Desktop</a>
2. MacOS or Windows 64-bit  
3. A modern browser on desktop or mobile*
   (If using Safari, it must be a recent version, circa  April 2021).
  
# Setup  
1. Download the latest MacOS or Windows executable [here](https://github.com/zeropointnine/hqpwv/releases). The binary is unsigned. Instructions for running unsigned binaries on MacOS can be found [here](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac). If running an unsigned executable is not an option, it is suggested to download the source code and run the application using Node.js.
2. Make sure HQPlayer Desktop is running, and that your library is populated. Make sure the button "Allow control from network" is checked.
3. Run `hqpwv-server` from the same computer as HQPlayer. The console output should give you a webpage url to navigate to (eg, something like`http://192.168.1.XXX:8000`).
4. Navigate to the url from any desktop or mobile browser that's on the same network as HQPlayer/HQPWV. 
  
  
# Troubleshooting tips  
 TODO
 
# Roadmap, possible TODOs
- Consider supporting HQPlayer Embedded.  
- Consider supporting older versions of Desktop Safari and Mobile Safari.  
- Consider signing executables.
- Support running HQPWV on a different machine as HQPlayer.
- Add UI for controling HQPlayer upsampling filters. Also: Volume control (lol).
- Add filter (search) controls to library view.
- Consider pagination system for extremely-large user libraries.  
- Add track listing view, with filter controls.  
- Add a zoomed-in "now playing" view  
- Add support for saved playlist  
- Add 'metadata layer' to track number of plays and likes.
