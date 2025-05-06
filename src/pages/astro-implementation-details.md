---
layout: ../layouts/PostLayout.astro
title: 'Transition to Astro'
description: "Some things I collected to make my website work like I wanted while playing within Astro's playground."
date: '2025-05-06'
tags: ['meta']
---

I recently spend a couple days transitioning this website from the dead framework Gatsby, into [Astro](https://astro.build). I had felt the pressure of the shiny new framework for a bit now, but I'm always lazy about that sort of thing. The old system worked fine of course, so why change? This is a tale as old as time when it comes to software: keep supporting the legacy system or chase the shiny and potentially cause more problems than you solve. For my purposes, although the old system was working, there had been no updates for some time, and I had forgotten how it all worked. In corporate SaaS speak: I wanted to increase developer efficiency while solving critical security vulnerabilities.

### Let's abuse the tutorial

One of the things Astro has going for it are its docs - they're very thorough and extremely well put together. I decided to just walk through their [starter tutorial](https://docs.astro.build/en/tutorial/0-introduction/) because, unlike their blog themes, this one was bone stock without anything I'd need to undo. I knew after giving it a first quick read I was going to need to make some changes, but it was going to get me to the point where all my content and pages were going to be transferred from my previous setup.

One thing right from the start that I knew I wanted to keep was having the blog posts all living in the root folder. I did this mostly for URL aesthetics, I just like the way it looks. At first I thought it was going to be difficult, but Astro treats any `markdown` file as a page (inside the `src/pages` file), so really it was as simple as changing code that referenced `src/pages/posts` to `src/pages`.

```js
/* ./src/pages/index.astro */

// "./*.md" points to the "./src" folder .md files
// .sort object by date
const allPosts = Object.values(import.meta.glob("./*.md", { eager: true })).sort(
  (a, b) => Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date)
);
// index page will only list the first three posts in a list
const topPosts = allPosts.slice(0, 3);
```

I knew that I was going to use this `glob` in several places, so Astro recommends using a content collection, so I did that to make it more reusable.

```js
/* ./src/content.config */

import { glob } from "astro/loaders";
import { z, defineCollection } from "astro:content";
// Using the "base" for "./src/pages" kept all routing correct.
// I tried at first "base" to be "./src", but it would add on "/pages" to the URL
const blog = defineCollection({
    loader: glob({ pattern: '**/[^_]*.md', base: "./src/pages" }),
    schema: z.object({
      title: z.string(),
      date: z.string(),
      description: z.string(),
      tags: z.array(z.string())
    })
});
// Export a single `collections` object to register your collection(s)
export const collections = { blog };
```

```js
/* ./src/pages/index.astro */

// .sort object by date
const allPosts = await getCollection("blog").sort(
  (a, b) => Date.parse(b.frontmatter.date) - Date.parse(a.frontmatter.date)
);
// index page will only list the first three posts in a list
const topPosts = allPosts.slice(0, 3);
```

One of the requirements for my blog were tags, aka arrays of strings to describe content to help find more stuff like what you're already reading. By adding an array to the frontmatter of a post, eg. `tags: ['meta', 'personal']`, I could loop over `allPosts` and create an array of all the unique tags. This was covered in part of the tutorial, however I also wanted to show the counts for each of the tags as well to show how many posts had that tag in it.

The best way I could come up with at the time was to loop over the posts a second time and count up each tag. I'm sure if I thought long enough about it I could get fancy with this, but it works fine. If this were running a lot during render, or if this was a more expensive operation it would be worth the time. I think non-optimized code is fine as long as it's resilient, easy to read, and not causing performance problems in realistic conditions.

```js
/* ./src/pages/index.astro */

const tagsCount = allPosts.reduce((allTags: any, post: any) => {
  const postTags = post.data.tags;
  if (postTags) {
    postTags.forEach((tag: any) => {
      if (!allTags[tag]) {
        allTags[tag] = 0;
      }
      allTags[tag]++;
    });
  }
  return allTags;
}, {});
const tags = [...new Set(allPosts.map((post: any) => post.data.tags).flat())];

...

  <ul>
    {
      tags.map((tag: any) => (
        <li>
          <a href={`/blog/${tag}`}>
            {tag} - {tagsCount[tag]} {tagsCount[tag] > 1 ? "posts" : "post"}
          </a>
        </li>
      ))
    }
  </ul>
```

Another requirement I had that wasn't covered in the tutorial was having previous / next post links. I think this is a pretty common feature in blogs, so I figured we could get it going in Astro too.

```js
// 1. Get all the posts, and sort them like normal by date
const allPosts = (await getCollection("blog")).sort(
  (a: any, b: any) => Date.parse(b.data.date) - Date.parse(a.data.date)
);
// 2. Where are we in that list?
const currentPostIndex = allPosts.findIndex(
  (post) => post.id == Astro.props.url.slice(1)
);
// 3. Is there a post in the current index +1? If so what is it?
const previousPost =
  currentPostIndex + 1 === allPosts.length
    ? undefined
    : allPosts[currentPostIndex + 1];
// 4. Is there a post from the current index -1? If so what is it?
const nextPost =
  currentPostIndex === 0 ? undefined : allPosts[currentPostIndex - 1];

... 

  {
    // Are there any posts previous or next? If so, show them!
    (previousPost || nextPost) && (
      <div class="prev-next">
        <hr />
        <ul>
          {previousPost && (
            <li>
              <a href={`/${previousPost.id}/`}>
                ←&nbsp;{previousPost.data.title}
              </a>
            </li>
          )}
          {nextPost && (
            <li class="text-right">
              <a href={`/${nextPost.id}/`}>{nextPost.data.title}&nbsp;→</a>
            </li>
          )}
        </ul>
      </div>
    )
  }
```

Generally speaking though, I followed along the very well written tutorial and got my site up and running quickly.

### Random learnings

Compared to the complicated GraphQL queries I did for Gatsby, setting up the tools and functions I needed in Astro was a breath of vanilla JavaScript air. If you're coming from React, and its ecosystem, you'll find most of the things Astro is doing to be familiar - but easier. How you set up layouts and components just makes sense.

In Astro, you can add CSS styling to a specific component. This will scope it to that component as a [CSS Module](https://github.com/css-modules/css-modules). I had never used them before, so I learned quite a lot about how they work with the traditional CSS Cascade. For instance, this code existed within my `PostLayout.astro` file:

```css
/* src/layouts/PostLayout.astro */
@media (min-width: 40em) {
  h2,
  h3 {
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -40vw;
    margin-right: -40vw;
    width: 80vw;
    text-align: center;
  }
}
```

The `PostLayout.astro` file had a `<slot />` [component](https://docs.astro.build/en/basics/astro-components/#slots) which Astro uses to put your content into a layout. I had initially assumed that the `h2, h3` elements would inherit these styles due to the Cascade. This wasn't the case, as they're scoped to the elements themselves within the `PostLayout.astro`. So I had to move this CSS into the `global.css` file. There is a way to [force something into global](https://docs.astro.build/en/guides/styling/#global-styles), but I felt the following was easier to understand:

```css
/* src/styles/global.css */
@media (min-width: 40em) {
  article h2,
  article h3 {
    position: relative;
    left: 50%;
    right: 50%;
    margin-left: -40vw;
    margin-right: -40vw;
    width: 80vw;
    text-align: center;
  }
}
```

Also, and this is completely separate from Astro, but I always had a smattering of random hex colors throughout my CSS. I took the opportunity to add CSS variables. Naming these is hard, but describing what it's doing, rather than some sort of color or shade index, always helps me remember what color is wh at. By setting up the dark mode this way, I could remove dozens of lines of code from my CSS and just rely on this switch to do all the work.

```css
:root {
  --body-background-color: #fff;
  --box-shadow-color: #222;
  --heading-color: #333;
  --highlight-background-color: #555;
  --highlight-link-color: #fff;
  --link-color: #0074d9;
  --link-color-visited: #b10dc9;
  --link-color-hover: #39cccc;
  --text-color: #555;
}

@media screen and (prefers-color-scheme: dark) {
  :root {
    --body-background-color: #333;
    --box-shadow-color: #000;
    --heading-color: #fff;
    --highlight-background-color: #999;
    --highlight-link-color: #333;
    --link-color: #90e0ef;
    --link-color-visited: #00b4d8;
    --text-color: #ededed;
  }
}
```

All in all, I had a great time getting my website moved over to Astro. It had been something I had put off for some time because of laziness, and it was working fine before I suppose. The [codebase](https://github.com/drainpip/shaneis.me-v4) is so much more clean, and easier to understand, which is helpful when I'll make some updates a year or more from now.