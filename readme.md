# Stati

Static blog generator.

## Installation

```
npm i -g stati
```


## Usage

It doesn't care about your directory structure, If you run it in a specific directory then it will recursively look for all the markdown and handlebars template files you have.

- It will use the markdown `*.md` files as posts
- It will use the handlebars `*.hbs` files as templates
    - `post.hb`: as a template for the posts
    - `home.hbs`: as a template for the home


Then It will parse all those files and write:
    - An `index.html` inside the project root directory.
    - All the posts inside 

## Test & Demo

- `git clone https://github.com/alexcorvi/stati.git`
- `cd stati`
- `npm link`
- `cd sample`
- `stati`