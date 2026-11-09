# Werkstück

Eigenständige, deutschsprachige Bauanleitungswebsite. Erstes Beispiel: eine parametrische Werkstattkiste. Noch kein Probebau und keine zugesicherte Tragfähigkeit.

## Bereits vorhanden

- Drehbares 3D-Modell, Explosionsansicht und auswählbare Bauteile.
- Freie metrische Maße ohne festes Raster; alle Ausgaben nutzen dieselbe Geometrie.
- Materialbudget, Werkzeugcheckliste und lokale Fortschrittsspeicherung.
- Fünf Montageschritte mit manueller Steuerung und Wiedergabe.
- Zuschnittliste als CSV, direkter PDF-Download (kurz und ausführlich).
- Lokaler Entwurfsimport und -export als JSON.
- Getrennte Test-/Live-Konfiguration und vorbereitete GitHub-Pages-Workflows.
- Keine automatisierte Fotoauswertung, keine Konten und keine Analyse-Dienste.

## Lokal ansehen

`Werkstueck-offline.html` lässt sich nach dem Erzeugen direkt in einem Browser öffnen. Keine Installation, kein Server und keine Verbindung zu einem KI-Dienst notwendig. Enthaltene PDF-Bibliothek: pdf-lib, MIT-Lizenz in `vendor/`.

Für die Entwicklung mit Node.js 22 oder neuer:

```sh
npm test
npm run build
npm run dev
```

Die Vorschau läuft standardmäßig auf `http://127.0.0.1:4173`. Bei belegtem Port z. B. `PORT=43871 npm run dev`. Keine Paketinstallation nötig.

Offlineversion nach Änderungen aktualisieren:

```sh
node scripts/offline.mjs
```

## GitHub: zwei getrennte Websites

Vorbereitete Zielnamen für das Konto `BTH840`:

| Repository | Zweck | Vorgesehene Adresse |
| --- | --- | --- |
| `werkstueck` | Maßgeblicher Quellcode und Livewebsite | `https://bth840.github.io/werkstueck/` |
| `werkstueck-test` | Testwebsite; zieht den Quellstand aus `werkstueck` | `https://bth840.github.io/werkstueck-test/` |

**Status bei Übergabe:** lokal erstellt und geprüft. Die Repositories, Pages-Einstellungen und tatsächlichen Veröffentlichungen müssen noch über den angemeldeten GitHub-Zugang eingerichtet werden. Diese Adressen sind vorgesehen, nicht als funktionierend bestätigt.

### Ersteinrichtung

1. Beide Repositories öffentlich und ohne fremde Inhalte anlegen. Dadurch sind Code, Website und Teststände öffentlich. Keine vertraulichen Dateien hochladen.
2. Diesen Quellcode einschließlich `.github/` in `werkstueck`, Branch `main`, übertragen. Den Workflow `pages.yml` und diese Anleitung auch in `werkstueck-test`, Branch `main`, ablegen. Die Testseite benötigt keine zweite gepflegte Kopie des App-Codes.
3. In beiden Repositories unter **Settings → Pages → Build and deployment** als Quelle **GitHub Actions** auswählen.
4. Im Testrepository unter **Actions → Test oder Live veröffentlichen → Run workflow** `main` als `source_ref` eingeben. Der Workflow lädt exakt den Quellstand aus dem Hauptrepository, führt Tests aus und veröffentlicht die Testwebsite.
5. Testwebsite prüfen. Die vollständige SHA steht im Workflow-Protokoll und in `build.json` der Testwebsite.
6. Erst dann denselben Workflow im Liverepository starten und die vollständige geprüfte SHA eingeben. `main` wird für Live absichtlich zurückgewiesen.

### Wie die Trennung funktioniert

- Zwei getrennte Pages-Deployments und Zieladressen.
- Unterschiedliche Umgebungskennzeichnung und separate Browserspeicherschlüssel.
- Testversion mit `noindex` und `robots.txt`; dennoch öffentlich erreichbar.
- Live akzeptiert ausschließlich eine vollständige Commit-SHA, die mit der aktuell veröffentlichten Testversion übereinstimmt.
- Tests laufen bei Änderungen und vor jeder Veröffentlichung. Test- und Liveveröffentlichung werden bewusst manuell gestartet; ohne Freigabe ändert sich Live nicht.
- Keine repositoryübergreifenden persönlichen Tokens und keine KI-Schlüssel nötig. Die Testseite liest den öffentlichen Quellcode.

Für eine Rückkehr zu einem älteren Stand diesen zunächst im Testrepository veröffentlichen und prüfen, anschließend dessen SHA live veröffentlichen. Private Repositories oder eine geschützte Testadresse benötigen eine andere Tarif-/Hostingentscheidung. Diese Grundversion bleibt vollständig statisch.

## Gemeinsam weitere Projekte erstellen

Neue Modelle werden zunächst hier im Gespräch aus Fotos, Skizzen und bestätigten Maßen entwickelt. `src/core.js` enthält die maßgebliche Bauteilgeometrie und Anleitung für das erste Projekt; `src/viewer.js` stellt die Bauteile ohne externe 3D-Dienste dar. Vor Veröffentlichung einer neuen Konstruktion müssen deren Maße, Verbindungen und Montagefolge geprüft werden. Die Web-Werkbank speichert aktuell Varianten der Werkstattkiste; sie ist noch kein universeller Konstruktionseditor.

Die Flächenreserve des Kostenrechners ist kein optimierter Plattenzuschnitt. Ganze Einkaufsgebinde und Werkzeugkosten sind nicht enthalten. Es werden keine Händlerpreise abgerufen.

## Technik und Nachweise

Statisches HTML, CSS und JavaScript ohne Build-Abhängigkeiten. Node.js wird nur für lokale Vorschau, Tests und das Kopieren der Veröffentlichungsdateien verwendet. Die PDF-Erzeugung erfolgt im Browser mit der mitgelieferten Bibliothek. Kein CDN, kein Tracking, keine externen Schriften.

`src/core.test.js` prüft Geometrie und Verbindungen, freie Dezimalmaße, ungültige Eingaben, Kosten, Dateiformat und Ausgabe-Konsistenz. Manuell geprüft wurden Desktopdarstellung, mobile Breite 390 px, Maßübernahme, Bauteilauswahl, Montage, lokale Speicherung und PDF-Ausgabe. Der kompakte PDF-Download wurde im Browser geprüft und visuell gerendert; die ausführliche PDF-Seitengestaltung zusätzlich lokal geprüft. Die Offline-Datei wurde syntaktisch geprüft; die Browserprüfung erfolgte über die lokale HTTP-Vorschau. Ein echter Probebau steht aus.
