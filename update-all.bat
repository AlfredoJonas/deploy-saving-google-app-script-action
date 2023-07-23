ECHO "UPDATING BRANCHES"
git checkout main
git pull origin main

git checkout jonas-gonzalez
git merge main
git push origin jonas-gonzalez

git checkout carmen-uzcategui
git merge main
git push origin carmen-uzcategui

git checkout angelica-gonzalez
git merge main
git push origin angelica-gonzalez

git checkout maldonado-perez
git merge main
git push origin maldonado-perez

git checkout josue-nino
git merge main
git push origin josue-nino