# 📁 Portfolio

Site portfolio personnel de **Matty Fourmestraux**, étudiant en BUT Informatique à l'IUT d'Artois (Lens).

🔗 **Site en ligne :** [racerevo.github.io/Portfolio](https://racerevo.github.io/Portfolio/)

---

## 🛠️ Stack technique

- [Hugo](https://gohugo.io/) — générateur de site statique
- HTML / CSS
- Déploiement automatique via **GitHub Actions** vers **GitHub Pages**

## 🚀 Développement local

Cloner le projet puis lancer le serveur Hugo :

```bash
git clone https://github.com/Racerevo/Portfolio.git
cd Portfolio
hugo server -D
```

Le site est accessible sur [http://localhost:1313/](http://localhost:1313/)

## 📦 Build

```bash
hugo --minify
```

Les fichiers générés se trouvent dans le dossier `public/` (ignoré par Git — il est régénéré automatiquement à chaque déploiement).

## 📤 Déploiement

Le déploiement est automatique : chaque `push` sur la branche `master` déclenche un workflow GitHub Actions qui build le site avec Hugo et le publie sur GitHub Pages.

Voir : [`.github/workflows/hugo.yml`](.github/workflows/hugo.yml)

## 📬 Contact

📧 [Matty.fourmestraux@gmail.com](mailto:Matty.fourmestraux@gmail.com)
