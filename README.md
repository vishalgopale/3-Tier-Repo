# three-tier-visual

An animated, step-by-step diagram that explains a **three-tier architecture** (web, application, database) inside an AWS VPC with an Internet Gateway using a restaurant run by a owner named Ravi. No build step, no dependencies: plain HTML, CSS and JavaScript.

| Tech term | Restaurant analogy |
|---|---|
| Browser / user | The hungry guest |
| VPC | Ravi's fenced plot |
| Internet Gateway | The main gate in the fence |
| Public / private subnet | Guest-friendly dining hall / staff-only kitchen and pantry |
| Web servers (presentation tier) | Dining hall with waiters |
| App servers (application tier) | Kitchen with chefs |
| Database (data tier) | Pantry and ledger book |
| Load balancer | Receptionist who seats guests |
| API call | Order slip from waiter to chef |
| Cache | Quick shelf next to the chef |
| Replica | Photocopy of the ledger in another building |
| Auto Scaling | Extra staff in rush hour |
| Security group / Firewall | Door guards |

## Moving objects

| Packet | Meaning |
|---|---|
| ✉️ | Visitor request |
| 📝 | Order slip (API call) |
| 💾 | Data going to the database |
| ⚡ | Cache hit (fast answer) |
| 🔁 | Database replication |
| ✅ | Response going back |
| 😈 | Intruder (gets blocked) |

## The 12 steps

1. **The big picture**: three tiers and the users
2. **The fenced plot**: the VPC (10.0.0.0/16)
3. **The main gate**: Internet Gateway and the internet
4. **Open and private areas**: public and private subnets
5. **Tier 1: Dining hall**: web server and a first request
6. **The receptionist**: load balancer shares requests
7. **Tier 2: Kitchen**: app servers and the API call
8. **Tier 3: Pantry**: primary database, data out and answer back
9. **The quick shelf**: cache hit versus cache miss
10. **Staying open**: replica in zone B and Auto Scaling
11. **Door guards**: firewall, security groups, blocked intruder
12. **One order's journey**: full round trip with numbered stops

## Run locally

```bash
cd three-tier-visual
python3 -m http.server 8000
```
Open http://localhost:8000

## Host on GitHub Pages

1. Create a new repository on GitHub and upload all files (keep the folder structure).
2. Open the repository **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**.
4. Select branch **main** and folder **/ (root)**, then click **Save**.
5. Wait a minute. Your site is live at `https://YOUR-USERNAME.github.io/REPO-NAME/`.

## Project structure

```
three-tier-visual/
  index.html     page structure only
  css/style.css  page theme (light/dark) and diagram styling
  js/app.js      builds the SVG, step data and caption text
  .nojekyll      tells GitHub Pages to serve files as they are
  LICENSE        MIT (replace YOUR NAME)
  README.md
```

## Customise

- **Text:** edit the `STEPS` array (titles, plain words, technical names) and `LEGEND` at the top of `js/app.js`.
- **Colours:** change `--gold`, `--teal`, `--purple`, `--blue`, `--red`, `--green` on `.stage` in `css/style.css`. Page colours are the variables in `:root`.
- **Layout:** boxes are placed with `box(step, colour, x, y, w, h, title, subtitle)`; wires live in the `W` object (SVG path strings).
- **Motion:** packets use `pkt(step, emoji, wireId, startSeconds, durationSeconds)`. Users who prefer reduced motion see a still diagram.

## License

MIT. See `LICENSE`.
