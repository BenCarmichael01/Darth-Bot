___

This Discord bot is a work in progress. I made this for my own personal use so I cannot guarantee stability or that it will be kept up to date. Use at your own risk! 

## Developing
The easiest way of getting the correct deps for this project on linux is by using Nix. Follow the official guides to get Nix installed on your system.\
Once you have nix installed, you can run `nix develop` in the project directory and you should be dropped into a Nix dev shell with all the required deps. 

Alternatively, install the following packages using your distribution's package manager:
- nodejs_22 (or later)
- pnpm (or npm, you will have to alter the package.json scripts accordingly)
- cmake (required for certain discordjs node packages)
- ffmpeg (required for voice)

### Using Nix direnv
This project also contains a nix direnv to automatically drop you into the dev shell when you enter the directory. After following the instructions [here](https://github.com/nix-community/nix-direnv?tab=readme-ov-file#installation), make sure to run `direnv allow` in the project root. After this, the devshell should automatically open the next time you cd into the project directory. 
