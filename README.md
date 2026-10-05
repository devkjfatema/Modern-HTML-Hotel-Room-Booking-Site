# Guesthouse website – setup guide

A fast, 4-page website in plain HTML, CSS and a little JavaScript. No frameworks, no build step, no backend.

```
index.html      Home (full-screen photo slider)
rooms.html      Rooms & Amenities (room blocks, amenities, pricing table)
gallery.html    Gallery (masonry grid + lightbox)
contact.html    Contact (email, WhatsApp, booking form, Google Map)
css/style.css   All styling (colours and fonts are at the top)
js/main.js      All behaviour (slider, menu, availability bar, animations, carousel, lightbox, form) + site settings
images/         Photos (WebP)
favicon.svg  robots.txt  sitemap.xml
```

---

## 1. Preview the site

Double-click `index.html`. It opens in your browser, no server needed.

## 2. Change business name, email, WhatsApp, phone and address

Every page contains the same placeholder text, so change it once with **Find and Replace in all files**
(VS Code: `Ctrl+Shift+H` / `Cmd+Shift+H`, or any editor with "replace in folder").
Replace in this order:

| Find | Replace with |
|---|---|
| `https://www.yourguesthouse.com` | your website address (no trailing slash) |
| `hello@yourguesthouse.com` | your email |
| `+00 000 000 0000` | phone as shown on the page, e.g. `+62 812 3456 7890` |
| `+000000000000` | same phone, digits only with `+`, e.g. `+6281234567890` |
| `000000000001` | **WhatsApp number**, international format, digits only, no `+` or spaces, e.g. `6281234567890` |
| `Your Guesthouse` | your guesthouse name |
| `123 Garden Lane` | street |
| `XXXXX` | postcode |
| `Your Town` / `Your Region` / `Your Country` | town / region / country |
| `From 14:00` / `By 11:00` / `Daily, 07:00 – 22:00` | check-in / check-out / reception hours |

Also search for `TODO` – every place that needs your details has a `TODO` comment.
Social links (Instagram/Facebook) are in the footer of each page.

**WhatsApp buttons** open a direct chat with your number and a ready message.
The booking form and "Enquire about this room" buttons add the guest's details or the room name to that message.

## 3. Google Map (contact.html)

1. Open maps.google.com and find your place.
2. Click **Share → Embed a map**, copy the `src="…"` address.
3. In `contact.html` find `<iframe` and paste it into `src="…"`.
4. Click **Share → Copy link** and replace the "Open in Google Maps" link (search for `maps.google.com/?q=`).

## 4. Replace the photos

`images/` already contains the real photos (WebP). To swap one, save your photo with the **same file name** and the page updates itself.

| File | Used for | Size |
|---|---|---|
| `hero-1.webp` … `hero-5.webp` (+ `-800` small copy for phones) | Home slider | 1376 × 768 / 800 × 447 |
| `hero-rooms`, `hero-gallery`, `hero-contact` (+ `-800`) | Top photo of Rooms, Gallery, Contact pages | 1376 × 768 / 800 × 447 |
| `room-garden`, `room-deluxe`, `room-suite` | Room photos | landscape |
| `intro-entrance`, `garden-hammock`, `bathroom`, `pool-detail`, `reading-nook`, `suite-balcony`, `dinner-courtyard`, `towels-detail` | Home + Gallery | portrait |
| `breakfast`, `terrace-coffee`, `dining-table`, `garden-palms` | Home + Gallery | landscape / square |

**Compress before uploading**: open <https://squoosh.app>, choose **WebP**, quality about 75, resize to about 1400 px wide for big photos. Aim for under 200 KB each.
If your photo has a different shape, update `width="…" height="…"` on its `<img>` and rewrite the `alt="…"` text.

## 5. Edit text, rooms and prices

Open the page in a text editor and change the words between the tags. Comments such as `<!-- ===== ROOMS ===== -->` mark each section.

* **Room details:** `rooms.html`, inside each `<article class="room-block">`. To add a room, copy one whole `<article>…</article>`, give it a new `id`, and add a row in the rates table and an `<option>` in the booking form (`contact.html`).
* **Pricing table:** `rooms.html`, section "RATES". Replace each `On request` with a price, e.g. `€95`. On phones the table turns into cards automatically.
* **Amenities:** `rooms.html`, section "AMENITIES" – one `<li>` per item.
* **Policies:** `rooms.html`, section "GOOD TO KNOW".
* The three room cards on the home page are in `index.html`, section "FEATURED ROOMS". The **"Most popular"** label is a `<span class="badge">` – move or delete it.
* **Home "Rates at a glance" table:** `index.html`, section "RATES". Keep the prices the same as `rooms.html`.
* **Amenities carousel (home):** `index.html`, section "AMENITIES" – one `<li class="amenity-card">` per card.
* **Availability bar (home):** no booking engine. "Check Availability" opens the Contact page with the dates and guests already filled in, ready to send by WhatsApp or email.

## 6. Gallery: add or remove photos

In `gallery.html` each photo is one line starting with `<li data-category="…">`.

* **Remove:** delete that line.
* **Add:** copy a line, then change `data-category` (`rooms`, `pool-garden` or `dining`), `data-caption`, the image file name, `width`/`height` and `alt`.

## 7. Slider speed and zoom (home page)

Open `js/main.js` and edit the `HERO` block near the top:

```js
const HERO = { slideMs: 4500, fadeMs: 900, zoom: 1.12 };
```

`slideMs` = seconds per photo (3500 = faster, 6000 = slower) · `zoom` = zoom amount (1.2 = stronger, 1 = none).
To change the home slider photos, edit the five `hero__slide` blocks in `index.html`.
Visitors who set "reduce motion" on their device get no autoplay and no zoom.

**Scroll animations:** elements with `data-reveal` fade in while scrolling (`--d` = delay). To switch them off, delete `data-reveal` attributes or the section "SCROLL ANIMATIONS" in `css/style.css`. They are also off for "reduce motion" visitors.

## 8. Colours and fonts

* Colours: top of `css/style.css` (section 1) – change `--accent` for the main colour.
  For a ready-made green look, change `<html lang="en">` to `<html lang="en" data-accent="sage">` on every page.
* Fonts: replace the Google Fonts link in the `<head>` of each page, then update `--font-serif` / `--font-sans` in `css/style.css`.

## 9. Publish for free

* **Netlify:** go to app.netlify.com/drop and drag the whole folder in. You get a live link in seconds.
* **GitHub Pages:** create a repository, upload the files, then Settings → Pages → deploy from the main branch.
* **Own domain:** in Netlify (Domain management) or GitHub Pages (Custom domain) add your domain and follow the DNS steps. Then make sure the domain you typed in step 2 matches, and also in `robots.txt` and `sitemap.xml`.

## 10. After launch (SEO checklist)

1. Create or claim your **Google Business Profile** (same name, address and phone as the site).
2. Add the site to **Google Search Console** and submit `https://your-domain/sitemap.xml`.
3. Check each page's title and description (in the `<head>`) are unique and mention your town.
4. Make sure every photo has a real `alt` description.
5. Test on your phone with Google PageSpeed Insights.

## 11. Photo credits

The photos in `images/` were supplied by the site owner. Confirm you have the right to use them commercially (list source / licence here if from a stock site):

| File | Source | Photographer / licence |
|---|---|---|
| | | |

Free stock sites that allow commercial use: Unsplash, Pexels, Pixabay. Own photos of the real property convert best.
