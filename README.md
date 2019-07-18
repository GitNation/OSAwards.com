# OS Awards Project website

Set of independent pages (landing and sub-pages per each award), powering https://osawards.com.

* `/react` - React OS Awards
* `/javascript` - JS OS Awards
* `/vue` - Vue OS Awards

Each sub-site is a static website, with no templating and few gulp scripts to build SASS, sprites, run dev server and perform FTP deploy.

If you're interested to host new technology OS awards, contact us via [hi@gitnation.org](mailto:hi@gitnation.org) (foundation supporting the initiative), we're open to welcome more OS awards categories in other tech and other frameworks.

## Contribution

Install npm deps (in directory of target page, say `/react`), run dev mode with:

```
npm run dev
```

Open http://localhost:3000

### Prod

Run prod build with


```
npm run build
```

Open `index.html` to test.

Built files should be comited to repo, as deploy is a simple FTP upload of all repo contents.
