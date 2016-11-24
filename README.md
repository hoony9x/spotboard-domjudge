# Spotboard for DOMjudge

"Spotboard for DOMjudge" is designed to use [Spotboard](https://github.com/spotboard/spotboard) with [DOMjudge](https://github.com/DOMjudge/domjudge) system.

### Prerequisite
  - Node.JS (Minimum required version : 4.x)

### Installation
```sh
$ git clone https://github.com/khhan1993/spotboard-domjudge.git
$ cd spotboard-domjudge
$ npm install
```

### How to use
  - Go to 'spotboard-domjudge/config' directory.
  - You can find 'contest_info.json' and 'user_info.json'.
  - In 'contest_info.json' you can see like this.
```json
{
  "contest_url": "YOUR_DOMJUDGE_BASE_URL",
  "contest_id": "YOUR_DOMJUDGE_CONTEST_ID",
  "contest_team_category_id": "YOUR_DOMJUDGE_TEAM_CATEGORY_ID"
}
```
  - Change these values to yours.
  - Note that 'contest_id', 'contest_team_category_id' value must be **Positive Integer**.
  - In 'user_info.json' you can see like this.
```json
{
  "id": "YOUR_ID_WITH_JURY_PERMISSION",
  "pw": "YOUR_PASSWORD"
}
```
  - Note that 'id' must have 'jury' or 'admin' permission.

## Other Documentation
  - DOMjudge : https://www.domjudge.org/documentation
  - Spotboard : https://github.com/spotboard/spotboard

## TODO
  - Allow multiple team category.
  - Fix 'connection closed' problem due to session timeout.
  - Deal with invalid submission (due to 'rejudge', 'ignore submission')
  - Ignore submissions with "TOO LATE" result.
  - Deal with disqualified team. (Currently, if contest has disqualifed team, spotboard did not work.)
  - And many problems not found yet(...).

## License
  - MIT License for only this project.
