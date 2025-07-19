<h1 align="center">
  project-catatsaja-reactrouter
</h1>

<p align="center">
  <a href="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml" target="_blank">
    <img src="https://github.com/ardeman/project-catatsaja-reactrouter/actions/workflows/firebase-remix.yml/badge.svg?branch=main" alt="Deployment Status" />
  </a>
</p>

## About

This is a web application for managing notes, tasks, and money logs. It is built with React Router.

## 🍴 Forking This Repo

Feel free to fork this repository. If you do, please give proper credit by linking back to [ardeman.com](https://ardeman.com/). Thank you!

## 🎛️ Installation & Setup

### Prerequisites

- Node.js v22.11.0
- pnpm v9.14.4
- firebase-tools v13.12.0

### Steps

1. Clone the repository:

   ```shell
   git clone https://github.com/ardeman/project-catatsaja-reactrouter.git
   ```

2. Navigate to the project directory:

   ```shell
   cd project-catatsaja-reactrouter
   ```

3. Install dependencies:

   ```shell
   pnpm install
   ```

4. Create `.env` file based on `.env.example`, and put firebase configuration
   and your Gravatar API key there.

5. Set up firebase tools:

   ```shell
   firebase login
   firebase deploy --only firestore
   ```

6. Start the development server:

   ```shell
   pnpm dev
   ```

   Then, open [http://localhost:5173](http://localhost:5173) in your browser to view the app.

### Additional Commands

- **Install Husky Git Hooks**:

  ```shell
  pnpm prepare
  ```

- **Lint, typecheck and check the unused code**:

  ```shell
  pnpm validate
  ```

- **Format the code**:

  ```shell
  pnpm format
  ```

- **Build for production**:

  ```shell
  pnpm build
  ```

- **Preview the production server**:

  ```shell
  pnpm preview
  ```
