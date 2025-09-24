# BEE_PROJECT

Full stack project

<br>

# Project setup
1. Run `git clone https://github.com/Gagan499/BEE_PROJECT.git` to clone the project. 
2. Run `npm install` after cloning the project.
3. Create .env file. Refer to [Templates](#templates) section for .env template.
4. All dependencies are now managed through package.json - no need to install them manually.

## Development Scripts

- **Production**: `npm start` - Runs the server with Node.js
- **Development**: `npm run dev` - Runs the server with nodemon (auto-restart on file changes)

### Development with Nodemon

For development, use `npm run dev` instead of `npm start`. This will:
- Automatically restart the server when you make changes to files
- Watch files in `src/`, `config/`, and `models/` directories
- Monitor `.js`, `.ejs`, and `.json` files
- Ignore `node_modules` and `public/assets` directories


<br><br>

# Templates
**<big><big>.env</big></big>**  
mongo_uri=mongodb+srv://VinSmokeSanji:sanji@bee.lvgjcbi.mongodb.net/bee_db?retryWrites=true&w=majority&appName=BEE
secret_key=[yoursecretkey]  
PORT=3000


**<big><big>.filename</big></big>**  

<br><br>

# Suggestions

install any canvas preview [(Charkoal for VS Code)](https://marketplace.visualstudio.com/items?itemName=Charkoal.charkoal:) extension to view the .canvas file
