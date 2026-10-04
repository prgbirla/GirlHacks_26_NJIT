# 🌲 Knowledge Forest

An interactive visual knowledge map built for curious high schoolers exploring mathematics on their own terms.

---

## 💡 About the Project

In an era crowded with generic, AI-generated curricula, learners rarely get the serendipity of stumbling into tangents, rabbit holes, and self-directed deep dives. Figuring out what concept to tackle next—or reverse-engineering a path toward an advanced topic—can be daunting without a mentor.

**Knowledge Forest** maps out how mathematical concepts connect, branch, and build upon one another:
* **Bottom-Up Exploration:** Start at your current comfort level and branch into new territory.
* **Top-Down Reverse Pathing:** Pick an ambitious target concept and backtrack to see the exact prerequisites required.

> Built during a **24-hour hackathon**, this prototype features concepts spanning from high school Algebra to college-level Optimization. While the grand vision encompasses multiple disciplines (machine learning, engineering, biology, and beyond), mathematics serves as the ideal playground to showcase both interconnected and linear learning paths.

---

## ✨ Features & Architecture

* **Bidirectional Traversal:** View both upstream prerequisites and downstream applications.
* **Optimized Rendering:** Renders graph structures efficiently to avoid latency during exploration.
* **Cross-Disciplinary Seeds:** Foundations in place to connect into neighboring "forests" (other STEM domains).
* **Future Roadmap:** Interactive "rabbit holes" that bridge distinct domains dynamically.

---

## 🛠️ Tech Stack

* **Framework:** [TanStack Start](https://tanstack.com/start)
* **Language:** TypeScript
* **UI & Styling:** React, Tailwind CSS
* **Prototyping & Scaffolding:** [Lovable](https://lovable.dev)

---

## 🚀 Getting Started

### Prerequisites

Ensure you have **Node.js** and **npm** installed (recommended via [nvm](https://github.com/nvm-sh/nvm#installing-and-updating)).

### Local Setup

```sh
# Clone the repository
git clone <this-repository-url>

# Navigate into the project directory
cd <repository-name>

# Install dependencies
npm install

# Start the local development server
npm run dev
