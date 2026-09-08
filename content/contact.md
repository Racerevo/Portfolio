---
title: "Contact"
layout: "contact"
description: "Mes coordonnées, mes liens professionnels et mon CV — disponible pour une alternance en informatique à partir de janvier 2027."
eyebrow: "Prenons contact"
heading: "Discutons de votre"
title_accent: "alternance"
lead: "Une offre d'alternance, une question sur un projet, ou juste l'envie d'en savoir plus ? Je réponds sous 24 h, du lundi au samedi."
status: "Disponible pour une alternance à partir de janvier 2027"

# Chaque canal devient une tuile cliquable.
channels:
  - icon: "✉️"
    label: "Email"
    value: "matty.fourmestraux@gmail.com"
    action: "Écrire un message"
    # form: true -> la tuile ouvre le formulaire ci-dessous au lieu d'un lien
    form: true
  - icon: "📞"
    label: "Téléphone"
    value: "06 74 73 22 08"
    href: "tel:+33674732208"
    action: "Appeler"
  - icon: "💼"
    label: "LinkedIn"
    value: "Matty Fourmestraux"
    href: "https://www.linkedin.com/in/matty-fourmestraux-4b010736a/"
    action: "Voir le profil"
    external: true
  - icon: "💻"
    label: "GitHub"
    value: "github.com/Racerevo"
    href: "https://github.com/Racerevo"
    action: "Voir les dépôts"
    external: true

# ---------------------------------------------------------------------------
# Formulaire de contact
#
# POUR ACTIVER L'ENVOI REEL (2 minutes, gratuit, sans compte) :
#   1. Va sur https://web3forms.com
#   2. Entre matty.fourmestraux@gmail.com et clique sur "Create Access Key"
#   3. Tu reçois une clé par mail (du style 1a2b3c4d-...)
#   4. Colle-la ci-dessous entre les guillemets d'access_key
#
# Tant qu'access_key est vide, le formulaire fonctionne quand même : il ouvre
# la messagerie du visiteur avec l'objet et le corps déjà remplis.
# ---------------------------------------------------------------------------
form:
  access_key: "801ced0d-71aa-4a91-9d3b-dbfb7db3eb7e"
  title: "Écrivez-moi directement"
  text: "Le message arrive dans ma boîte, je réponds sous 24 h."
  subject_default: "Alternance — prise de contact"
  submit: "Envoyer le message"
  sending: "Envoi en cours…"
  success: "Message envoyé, merci ! Je vous réponds sous 24 h."
  error: "L'envoi n'a pas abouti. Vous pouvez m'écrire directement à matty.fourmestraux@gmail.com."
  fallback_note: "Le formulaire ouvrira votre messagerie avec le message pré-rempli."
  labels:
    name: "Votre nom"
    email: "Votre email"
    company: "Entreprise ou école (facultatif)"
    subject: "Objet"
    message: "Votre message"
  placeholders:
    name: "Camille Dupont"
    email: "camille.dupont@entreprise.fr"
    company: "Nom de la structure"
    message: "Bonjour Matty, nous recherchons un alternant en développement à partir de janvier 2027…"

cv:
  title: "Mon CV en une page"
  text: "Parcours, projets et compétences techniques, à jour pour la recherche d'alternance BUT 2."
  file: "cv/cv.pdf"
  button: "Télécharger le CV (PDF)"

# Informations pratiques, celles que demande un recruteur avant tout le reste.
facts:
  - label: "Formation"
    value: "2ème année de BUT Informatique — IUT d'Artois, Lens"
  - label: "Recherche"
    value: "Alternance en informatique, à partir de janvier 2027"
  - label: "Secteur"
    value: "Lille, Lens, Arras et alentours"
  - label: "Basé à"
    value: "Annœullin (59)"
  - label: "Mobilité"
    value: "Permis B"
  - label: "En poste"
    value: "Hôte de caisse chez Carrefour, en parallèle des études"
---
