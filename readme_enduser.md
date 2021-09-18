
# HQPWV End-User Instructions  

HQPWV is a local webserver that allows you to remotely control <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer</a> from any device on your network using a web browser.

[![Demo video](https://i.vimeocdn.com/video/1226369138-b9eb51cefba593dcf444fd1bad72adcfae4474ee2ac765ea22cc37d1d90515b5-d?mw=1300&mh=813&q=90)](https://vimeo.com/593569610 "Demo video")
Demo video

# Requirements    
1. <a href="https://www.signalyst.com/consumer.html" target="_blank">HQPlayer 4</a>
2. MacOS, Windows (64-bit), or Linux (64-bit)
3. A modern desktop or mobile browser, connected to your local network
   (If using desktop or mobile Safari, it must be a recent version, circa April 2021)
  
# Setup  
1. Get the latest (unsigned) MacOS, Windows, or Linux executable [here](https://github.com/zeropointnine/hqpwv/releases). Instructions for running unsigned binaries on MacOS can be found [here](https://support.apple.com/guide/mac-help/open-a-mac-app-from-an-unidentified-developer-mh40616/mac). If running an unsigned executable is not an option, consider downloading the source code and run the application using Node.js.
2. Make sure HQPlayer is running, and that your library is populated. Verify that the "Allow control from network" button is checked.
3. Run `hqpwv-server`. Running it from the same computer as HQPlayer itself is recommended, but not required.
4. If all goes well, the console output should give you a webpage url to navigate to (eg, something like`http://192.168.X.XXX:8000`).
5. Navigate to the url from any desktop or mobile browser that's on the same network as HQPlayer and HQPWV.
  
# Troubleshooting tips  
TODO
 
# Roadmap, possible TODOs
- Add DSD bitrates to the "Preset Rules" section.
- Support random playback.
- Pagination system for extra-large user libraries?
- Consider supporting older versions of Desktop Safari and Mobile Safari
- Consider signing executables for major and minor releases.
