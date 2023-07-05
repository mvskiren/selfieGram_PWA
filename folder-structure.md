# Folder Structure

### A typical top-level directory layout

    .
    ├── build                   # Compiled files (alternatively `dist`)
    ├── docs                    # Documentation files (alternatively `doc`)
    ├── src                     # Source files (alternatively `lib` or `app`)
    ├── test                    # Automated tests (alternatively `spec` or `tests`)
    ├── Utilities               # Tools and utilities
    ├── LICENSE
    ├── folder-structure.md
    └── README.md

## Motivations

- Clear feature ownership
- Module usage predictibility (refactoring, maintainence, you know
  what's shared, what's not, prevents accidental regressions,
  avoids huge directories of not-actually-reusable modules, etc)
- CI runs only the tests that matter (future)
- Server Side Rendering (future)

## How it works

The file structure maps directly to the route hierarchy, which maps
directly to the UI hierarchy.

It's inverted from the model that we've used in other systems. If we
consider all folders being either a "generic" or a "feature" folder, we
only have one "feature" folder but many "generic" folders.

Typical folder structure:

```
app
└── screens
    └── App
        └── screens
            ├── Admin
            │   └── screens
            │       ├── Reports
            │       └── Users
            └── Course
                └── screens
                    └── Assignments
```

Next, each of these screens has an `index.js` file, which is the file
that handles the entry into the screen, also known as a "Route Handler"
in react router. Its very much like a `Route` in Ember. We'll also have
some top-level application bootstrapping stuff at the root, like
`config/routes.js`.

```
app
├── config
│   └── routes.js
├── screens
│   └── App
│       ├── screens
│       │   ├── Admin
│       │   │   ├── screens
│       │   │   │   ├── Reports
│       │   │   │   │   └── index.js
│       │   │   │   └── Users
│       │   │   │       └── index.js
│       │   │   └── index.js
│       │   └── Course
│       │       ├── screens
│       │       │   └── Assignments
│       │       │       └── index.js
│       │       └── index.js
│       └── index.js
└── index.js
```

With this structure, each screen has its own directory to hold its
modules. In other words, we've introduced "scope" into our application
file structure.

Each will probably have a `components` directory.

```
Src
│   └── |
│       |   |   |
│       │   │   ├── Components
│       │   │   │   ├── ChallengePage
│       │   │   │   │   ├── components
│       │   │   │   │   └── index.js
│       │   │   │   └── Home
│       │   │   │       ├── components
│       │   │   │       └── index.js

│  
└── index.js


### Why "Screens"?

The other option is "views", which has become a lot like "controller".
What does it even mean? Screen seems pretty intuitive to me to mean "a
specific screen in the app" and not something that is shared. It has the
added benefit that there's no such thing as an "MSC" yet, so the word
"screen" causes people to ask "what's a screen?" instead of assuming
they know what a "view" is supposed to be.
```
