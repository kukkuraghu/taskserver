# taskserver
This program sets up a server to render tasks associated with users

Api end points are

  1. User Registration - /users/registerUser
  2. User Login - /users/authenticateUser
  3. User Login using facebook - /users/fbAuthenticateUser
  4. User Login using google - /users/googleAuthenticateUser
  5. Get the list of tasks associated with the user - /tasks/getTasks
  6. Add a task (adds a task with title) -  /tasks/addTask 
  7. Add a task with title and detail -  /tasks/addTaskWithDetail
  8. Delete a task - /tasks/deleteTask
  9. To mark a task complete - /tasks/markTaskComplete
  10. To mark the status of a task open -  /tasks/markTaskOpen
  
Steps to install
  1. clone or download the repository
  2. run npm install
  3. setup config.json under taskServer/config folder. "config - Copy.json" can be used as a template.
  4. "start_app_server.bat" can be used to start the server on windows
  

This is in WIP. 
  
