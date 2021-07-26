# HQPWV    
  
HQPWV is a local webserver that allows you to remotely control [HQPlayer](https://www.signalyst.com/consumer.html)  from any device on your network using a web browser.
  
Requires HQPlayer 4 Desktop.

For <em>end-user installation instructions</em>, [click here](https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md)  
  
[![Demo video](https://i.vimeocdn.com/video/1198463153?mw=1200&mh=751)](https://vimeo.com/579213725 "Demo video")  
Demo video  

# Development setup  
  
1. Make sure [HQPlayer 4 Desktop](https://www.signalyst.com/consumer.html) is running on the computer you'll be installing the project to.
  
2. `cd` to the project directory.  
  
3. Make sure Node.js is installed. Then enter:  
`npm install`. 
  
4. Make sure `sass` is installed. Then compile the css:  
`sass scss/main.scss www/css/main.css`  
  
5. Run the server  
`node server.js`
  
6. Browse to the locally served webpage as directed. 
  
Executables are generated with `pkg` by simply entering:
`pkg .`
