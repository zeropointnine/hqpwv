# HQPWV    
  
HQPWV is a local webserver that allows you to remotely control [HQPlayer](https://www.signalyst.com/consumer.html)  from any device on your network using a web browser.
  
Requires HQPlayer 4 (Desktop or Embedded).

For <em>end-user installation instructions</em>, [click here](https://github.com/zeropointnine/hqpwv/blob/master/readme_enduser.md)  
  
[![Demo video](https://i.vimeocdn.com/video/1226369138?mw=1200&mh=750)](https://vimeo.com/593569610 "Demo video")
Demo video

# Development setup  
  
1. `cd` to the project directory.
  
2. Make sure Node.js is installed. Then enter:
`npm install`. 
  
3. To modify the css, make sure `sass` is installed. Then compile with:
`sass scss/main.scss www/css/main.css`
If simply trying to run the project, this step can be skipped, as the compiled css is included in the repository.
  
4. Make sure [HQPlayer 4](https://www.signalyst.com/consumer.html) is running.

5. Start the server:
`node server/server.js`
  
6. Browse to the locally served webpage as directed.
  
Executables are generated with `pkg` by simply entering:
`pkg .`
