# Werkstück

Eigenständige, deutschsprachige Bauanleitungswebsite. Sechs parametrische Projekte: Werkstattkiste, Kohlmeisen-Nistkasten, Seil-Weihnachtsbaum, Haken-Garderobe, Latten-Utensilo und Pflanzkasten. Noch kein Probebau und keine zugesicherte Tragfähigkeit.

## Bereits vorhanden

- Drehbares 3D-Modell, Explosionsansicht und auswählbare Bauteile.
- Freie metrische Maße ohne festes Raster; alle Ausgaben nutzen dieselbe Geometrie.
- Materialbudget, Werkzeugcheckliste und lokale Fortschrittsspeicherung.
- Fünf Montageübersichten mit manueller Steuerung; zusätzlich ein 24-schrittiger bebilderter Werkstattkurs für die Haken-Garderobe mit Festool DF 500 Q.
- Zuschnittliste als CSV, direkter PDF-Download (kurz und ausführlich).
- Lokaler Entwurfsimport und -export als JSON, einschließlich Projekt und Verbindung; bisherige v1-Kistenentwürfe bleiben lesbar.
- Schrauben, Runddübel oder DOMINO-Dübel bei geeigneten Holzverbindungen; Seil und Bänder bleiben projektspezifisch.
- Eigene Quellen-/Variantenansicht, dynamische Maßprüfung und Verbindungsmittelpunkte.
- Gleich große Budgetfelder und Nach-oben-Button.
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

Eingerichtete Repositories für das Konto `BTH840`:

| Repository | Zweck | Adresse |
| --- | --- | --- |
| `werkstueck` | Maßgeblicher Quellcode und Livewebsite | `https://bth840.github.io/werkstueck/` |
| `werkstueck-test` | Testwebsite; zieht den Quellstand aus `werkstueck` | `https://bth840.github.io/werkstueck-test/` |

**Status am 9. November 2026:** Beide öffentlichen Repositories und Pages-Veröffentlichungen sind eingerichtet. Test- und Livewebsite sind erreichbar und im Browser geprüft. Beide verwenden den Quellstand `ef94329d43343cbbc787d383c936ac11c2e872dc`. Testlauf: https://github.com/BTH840/werkstueck-test/actions/runs/42579591214 · Livelauf: https://github.com/BTH840/werkstueck/actions/runs/42579802007. Maßänderung, Explosionsansicht, Montage und PDF-Erzeugung wurden auf der Testadresse geprüft. Live verwendet einen eigenen Browserspeicherschlüssel.

### Ersteinrichtung (bereits durchgeführt)

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

Neue Modelle werden zunächst hier im Gespräch aus Fotos, Skizzen und bestätigten Maßen entwickelt. `src/projects.js` enthält Projektstammdaten und Quellen. `src/core.js` berechnet Bauteile, Verbindungen und Anleitungen. `src/gpu.js` rendert mit Tiefenprüfung im Browser; `src/viewer.js` ergänzt Interaktion und einen 2D-Fallback. Es gibt keinen externen 3D-Dienst. Vor Veröffentlichung einer neuen Konstruktion müssen deren Maße, Verbindungen und Montagefolge geprüft werden. Die Web-Werkbank speichert Varianten aller sechs Projekte und deren Verbindungsauswahl; sie ist kein universeller Konstruktionseditor.

Die Flächenreserve des Kostenrechners ist kein optimierter Plattenzuschnitt. Ganze Einkaufsgebinde und Werkzeugkosten sind nicht enthalten. Es werden keine Händlerpreise abgerufen.

## Technik und Nachweise

Statisches HTML, CSS und JavaScript ohne Build-Abhängigkeiten. Node.js wird nur für lokale Vorschau, Tests und das Kopieren der Veröffentlichungsdateien verwendet. Die PDF-Erzeugung erfolgt im Browser mit der mitgelieferten Bibliothek. Kein CDN, kein Tracking, keine externen Schriften.

`src/core.test.js` prüft Geometrie und Verbindungen, freie Dezimalmaße, ungültige Eingaben, Kosten, Dateiformat und Ausgabe-Konsistenz. Manuell geprüft wurden Desktopdarstellung, mobile Breite 390 px, Maßübernahme, Bauteilauswahl, Montage, lokale Speicherung und PDF-Ausgabe. Der kompakte PDF-Download wurde im Browser geprüft und visuell gerendert; die ausführliche PDF-Seitengestaltung zusätzlich lokal geprüft. Die Offline-Datei wurde syntaktisch geprüft; die Browserprüfung erfolgte über die lokale HTTP-Vorschau. Ein echter Probebau steht aus.

## Version 0.2.0: Quellen- und Funktionsabgleich

Die fünf extern angeregten Anleitungen enthalten eigene Texte und Modelle. Fremde Fotos, Zeichnungen und vollständige Plan-PDFs werden nicht übernommen. Quellen und konkrete Abweichungen stehen in jeder Projektansicht sowie im exportierten PDF. Der Pflanzkasten nutzt eigene Maße und ist ausdrücklich kein maßgleicher Nachbau. Der Nistkasten ist eine eigene Flachdach-Variante mit festem 32-mm-Einflugloch.

Die Originalquellen sind überwiegend statisch. Belegte Ausgangsdaten werden mit unabhängigen Testwerten verglichen; neue Varianten prüfen wir anhand unserer Konstruktionsregeln. Eine dynamische Gleichheit mit fremden Konfiguratoren wird nicht behauptet. Details stehen in `qa-report.json` und direkt im Bereich „Quellen & Prüfung“.

DOMINO innen: 4 × 20 mm Buche; mit verkürztem D-4-Spezialfräser an der DF 500 bedeuten 20 mm Einstellung real 10 mm. DOMINO außen beim Pflanzkasten: 5 × 30 mm Sipo, asymmetrische Taschen 12 und 20 mm. Das Sipo-Sortiment und die Maschineneinstellungen wurden im verlinkten Festool-Handbuch kontrolliert. Die Auswahl ändert Werkzeuge, Material, Mittelpunktliste und Montage; stumpfe Außenmaße ändern sich dadurch nicht. Aufhängungen und Metallhaken behalten ihre separaten Befestigungen.

Für die sechs Projekte gibt es 15 Berechnungs-/Referenztests mit Prüfungen über Maßbereiche und Dateien. PDF-Erzeugung wurde für alle sechs Projekte in der Browseroberfläche geprüft; zusätzlich wurden zwölf PDF-Layouts erzeugt, Texte und Seitenränder kontrolliert und ausgewählte Seiten visuell geprüft. Die Bilder in den lokalen PDF-Layoutprüfungen sind ausdrücklich Platzhalter; die Browserdownloads verwenden die aktuellen 3D-Ansichten.

Die Version 0.2.0 wird zuerst ausschließlich in der Testumgebung veröffentlicht. Die bisherige Liveversion bleibt auf dem bereits freigegebenen Stand, bis eine eigene Livefreigabe erfolgt.

## Version 0.3.0: Ein Handgriff pro Arbeitsschritt

Die Haken-Garderobe mit DOMINO hat einen detaillierten Beispielkurs mit 24 eigenen Vektorzeichnungen. Abmessen, Anzeichnen, Sägen, D-4-Fräserwechsel, Anschläge, Taschen in Kante und Fläche, Probe, Trockenmontage, Schleifen, Verleimen und Beschlagmontage werden in einzelnen Handgriffen erklärt. Jeder Schritt zeigt Werkzeugwerte, Bezug und Ansatz sowie eine Ergebniskontrolle. Skizzen lassen sich vergrößern; Kursfortschritt wird je Maßvariante und Umgebung lokal gespeichert. Der ausführliche PDF-Download enthält denselben Kurs mit allen Skizzen.

Beispielgerät ist die kabelgebundene DF 500 Q. Die Quellen und der Unterschied zur neueren RQ-Baureihe sind im Kurs genannt; die Skizzen zeigen die Kontaktgeometrie, keine maßgetreue Nachbildung der Bedienelemente. D-4-Spezialfräser: Tiefe auf 20, real 10 mm; freier Höhenanschlag auf halbe tatsächliche Materialstärke. Enges erstes Taschenpaar, weitere Ablagetaschen mit der mittleren Breitenstufe. Die Breitenverstellung erfolgt nach Festool bei laufender Maschine außerhalb des Eingriffs; alle anderen Einrichtarbeiten stromlos.

Für die Garderobe wurden gut ablesbare Dübelpositionen mit höchstens 250 mm Teilung gewählt: Im 600-mm-Grundmaß 100 / 300 / 500 mm. Modell-Verbindungsliste und Kurs verwenden dieselben Werte. Alle anderen Projekte behalten ihre bisherigen Berechnungen. Wandbohrwerte und Beschlaglochbilder müssen zum tatsächlichen Untergrund und gekauften Beschlag passen; es werden keine universellen Werte erfunden. Ein praktischer Probebau steht weiterhin aus.

19 automatisierte Prüfungen: die 15 bisherigen plus vier Kursprüfungen für Referenzlage, Maßvarianten, richtige Arbeitsfolge und Projektauswahl. Veröffentlichung zuerst nur in der Testumgebung.

## Version 0.4.0: Werkstück statt Werkzeugbild

Der Beispielkurs ist als Bildanleitung aufgebaut: große nummerierte Einzelbilder, Teilnummern, Richtungspfeile, gestrichelte Anrisslinien, Mittelpunkte und Abstände direkt auf eigenen räumlichen Werkstückzeichnungen. Maschinen, Fräser, Messgeräte und Zwingen werden nicht mehr abgebildet. Wichtige Fräsachsen und Taschentiefen erhalten vergrößerte Details am Holz. Reale Koordinaten werden aus denselben Modelldaten auf die Werkstückflächen projiziert. Die Hakenansicht unterscheidet ausdrücklich zwischen Beschlagmitten und den noch vom echten Haken zu übertragenden Schraubenlöchern.

Die Bildschirmansicht zeigt eine kurze Aktion, das große Bild und die wesentlichen Einstellungen. Die einzelnen Handgriffe sind aufklappbar. Das PDF enthält Bildschritte und einen separaten Anhang mit allen Handgriffen. Allgemeine Gestaltungsreferenz ist der öffentlich verlinkte Aufbau einer IKEA-BEKVÄM-Anleitung. Fremde Grafiken, Texte, Symbole oder Bauteile werden nicht übernommen.

Version 0.4.0 wird nur in der Testumgebung veröffentlicht. Die Konstruktion und die Werte der DF 500 bleiben unverändert.

## Version 0.5.0: Zehn Bilder, drei Abschnitte

Der Beispielplan beginnt mit zwei einzelnen Zuschnittzeichnungen. Es folgen Anzeichnen, Fräsen und Bohrpunkte; erst danach Dübel, Fügen und Haken. Sichtbare Erklärungstexte und der PDF-Anhang entfallen. Die Website zeigt die Zeichnung mit Schrittwahl, die Bild-PDF hat genau zehn querformatige Seiten. Quellen bleiben separat aufklappbar. Die Text-Montageübersicht wird bei dieser Variante ausgeblendet.

Alle Holzteile verwenden dieselbe räumliche Projektion. Zur Blickrichtung passen die sichtbare linke Stirnfläche, Vorderkante und Oberseite. Die bisher fälschlich gezeichnete verdeckte rechte Stirnfläche entfällt. Zuschnitt, Anriss, Taschen und Zusammenbau verwenden durchgehend diese Geometrie. Die 20 Prüfungen umfassen auch die Projektionsrichtung und gemeinsame Kanten.
