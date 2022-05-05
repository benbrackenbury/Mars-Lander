Project structure

/ (root folder):
    - mostly config files for next.js
    - context.js sets up the global context/state for the app

pages
    - files not prefixed with an underscore are pages
    - files prefixed with an underscore are template/layout files
    - the api folder contains the api file used for fetching spacecraft profiles

public
    - static files such as images, spacraft profiles, 3D model files

style
    - SCSS files

three
    - files related to three js objects