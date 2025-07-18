{ pkgs }: {
  channel = "stable-24.05";
  packages = [
    pkgs.nodejs_22
    pkgs.pnpm
  ];
  idx.extensions = [];
  idx.previews = {};
}
