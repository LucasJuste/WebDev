# EPFBOOK
## Prerequisites
Afin de pouvoir utiliser correctement le script, il est necessaire d'avoir les bibliotheques suivantes:
 - curl
 - nvm
 - npm
 - node
 - git
 
 ## Installation
Et de les run avec les commandes suivantes:
 - apt install curl
 - curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.1/install.sh | bash
 - apt install npm
 - apt install git
 - nvm install node

## Deployment
Username: test
Password: test

On the website, you can navigate through the menu bar at the top left. It is possible to create new users with the /students/create page which will send the answers in the list-users.csv file. By clicking on the users on the /students page, the app.js code redirects to a new page /students/update which allows you to modify the information of the selected user. Finally it is possible to perform a binomial test by clicking on the Binomial Test button in the menu. Once on the /students/binomial-test page, a binomial test can be performed by inserting a "success" and a "trials". The result is output through a function in the app.js file via the "Compute" button.

## Who is the character ?
The character with id 5 is "Jerry Smith". By sending the link https://rickandmortyapi.com/documentation#character in Insomnia with GET point, I got the documentation page. Then I searched on this page for the link allowing me to get the id of any character. Finally I put this link in a GET point also on Insomnia by adding "/5" at the end to obtain the character having the id 5.