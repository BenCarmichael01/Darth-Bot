{
  description = "Flake containing devShell";

  inputs = {
    flake-utils.url = "github:numtide/flake-utils";
    nixpkgs.url = "github:nixos/nixpkgs/nixpkgs-unstable";

  };

  outputs = {self, nixpkgs, flake-utils}: 
    flake-utils.lib.eachDefaultSystem
      (system:
        let
          system = "x86_64-linux";
          pkgs = nixpkgs.legacyPackages.${system};
      in
      with pkgs; { 
          devShells.default = mkShell {
            buildInputs = [
              nodejs_22
              pnpm
              cmake
              ffmpeg_7-headless
            ];
          };
        }
      );
}