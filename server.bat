start cmd /k "gulp"
start cmd /c "cd../mws-restaurant-stage-3 && node server"

start cmd /c "cd ./dist && py -m http.server 8000"
exit