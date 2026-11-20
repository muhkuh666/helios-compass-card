# ☀️ Helios Compass Card

[![HACS Custom](https://img.shields.io/badge/HACS-Custom-41BDF5.svg)](https://hacs.xyz/)
![Version](https://img.shields.io/badge/version-1.6.0-orange.svg)

**PV-Sonnenkompass für Home Assistant.** Die Karte zeigt, aus welcher Himmelsrichtung deine Solaranlage wie viel liefert. Jeder Sektor der Rose steht für eine Sonnenrichtung. Die Farben zeigen die Leistungsklassen, die Länge den Anteil an Zeit oder Ertrag. Darunter liegt auf Wunsch ein Luftbild deines Hauses.

Geeignet für Balkonkraftwerke, Dachanlagen und beides zusammen.

[![In HACS öffnen](https://my.home-assistant.io/badges/hacs_repository.svg)](https://my.home-assistant.io/redirect/hacs_repository/?owner=muhkuh666&repository=helios-compass-card&category=plugin)

---

## Funktionen

- **Solarrose:** 16-teilige Kompassrose (N, NNO, NO … NNW) mit Sektoren nach Sonnenrichtung, gestapelt nach Leistungsklassen.
- **Vier Ansichten** per Umschalter:
  - **Zeit:** Wie lange kam die Sonne aus welcher Richtung?
  - **Ertrag:** Wie viel kWh kamen aus welcher Richtung?
  - **Ø Leistung:** Durchschnittsleistung je Richtung.
  - **Schatten:** Verschattungskarte aus Richtung × Sonnenhöhe. Sie zeigt, bei welchem Sonnenstand Bäume oder Nachbarhäuser Schatten werfen.
- **Sonnenbahnen:** die heutige Bahn mit Uhrzeiten, Auf- und Untergang sowie die Bahnen am längsten (21.6.) und kürzesten Tag (21.12.).
- **Zeiträume:** 1, 8, 12 und 24 Stunden, 7, 14 und 30 Tage, 1 Jahr, außerdem **Sommer** und **Winter** mit der jeweils anderen Jahreszeit als Vergleich.
- **Ertrag pro kWp:** spezifischer Ertrag je Anlage, z. B. „BKW 1,8 · Dach 1,5 kWh/kWp“ für einen fairen Vergleich.
- **Mehrere Anlagen:** z. B. BKW, Dach und „Gesamt“ (Summe) per Umschalter in einer Karte.
- **Kennzahlen:** Ertrag im Zeitraum, Spitzenleistung mit Zeitpunkt und Richtung, beste Richtung.
- **Modulausrichtung:** gestrichelte Pfeile mit Name und Neigung für jedes Modulfeld.
- **Hausbild (optional):** drehen, verschieben, skalieren und rund zuschneiden.
- **Live-Werte:** Sonnenmarker (orange bei Tag, grau bei Nacht), Sonnenazimut, Sonnenhöhe und aktuelle Leistung in den Ecken.
- **Legende:** Anteil je Leistungsklasse. Die Klasse, in der die aktuelle Leistung liegt, ist umrandet.
- **Grafischer Editor:** Alle Optionen sind per Klick einstellbar, YAML ist optional.
- Tooltips beim Überfahren der Sektoren. Ein Klick auf einen Eckwert öffnet die Detailansicht der Entität.
- Gewählte Anlage, Ansicht und Zeitraum werden je Browser gemerkt.

Den Sonnenstand für den Verlauf berechnet die Karte aus dem Standort deines Home Assistant. Du brauchst nur deinen Leistungssensor.

---

## Installation

### Über HACS (empfohlen)

1. Klicke oben auf **„In HACS öffnen“**. Alternativ: **HACS → ⋮ → Benutzerdefinierte Repositories**, URL `https://github.com/muhkuh666/helios-compass-card` eintragen und den Typ **Dashboard** wählen.
2. Suche nach **Helios Compass Card** und wähle **Herunterladen**.
3. Lade den Browser mit **Strg+F5** neu. In der Companion-App setzt du stattdessen den Frontend-Cache zurück.

HACS trägt die Ressource automatisch ein.

### Manuell

1. Kopiere `helios-compass-card.js` nach `/config/www/`.
2. Öffne **Einstellungen → Dashboards → ⋮ → Ressourcen → Ressource hinzufügen**. URL: `/local/helios-compass-card.js`, Typ: **JavaScript-Modul**.
3. Lade den Browser mit **Strg+F5** neu.

---

## Schnellstart

Bearbeite das Dashboard, wähle **Karte hinzufügen** und suche nach **„Helios Compass Card“**. Wähle deinen PV-Sensor, fertig.

Die minimale YAML-Konfiguration:

```yaml
type: custom:helios-compass-card
power_entity: sensor.pv_leistung
max_power: 8000
```

Für ein Balkonkraftwerk:

```yaml
type: custom:helios-compass-card
title: BKW
power_entity: sensor.bkw_leistung
max_power: 800
legend_label: BKW-Leistung
```

---

## Grafischer Editor

Der Editor ist in Abschnitte gegliedert. Die Vorschau aktualisiert sich bei jeder Änderung sofort.

| Abschnitt | Inhalt |
|---|---|
| ⚙️ **Allgemein** | Titel, PV-Sensor, maximale Leistung, Beschriftung der Farbskala, kWp |
| 🧭 **Darstellung** | Standard-Ansicht, Standard-Zeitraum, angezeigte Zeitraum-Buttons, Sommer/Winter-Vergleich, Sonnenbahnen, Anzahl und Deckkraft der Sektoren, Höhenringe der Schatten-Ansicht, Umschalter, Kennzahlen und Farbskala ein/aus |
| 🏠 **Hausbild** | Bildpfad, Drehung, Verschieben, Größe, Deckkraft, runder Zuschnitt |
| 🔲 **Werte in den Ecken** | je Ecke: Leistung der gewählten Anlage, beliebige Entität (mit Einheit und Nachkommastellen), Sonnenazimut, Sonnenhöhe oder ausblenden |
| 🔆 **Anlagen** | mehrere Sensoren mit kWp, eigenen Modulfeldern und Leistungsklassen, Summe „Gesamt“, Standard-Anlage |
| 📐 **Modulausrichtung** | Modulfelder für alle Anlagen: Name, Farbe, Azimut, Neigung, kWp |
| 🎨 **Leistungsklassen & Farben** | automatisch oder einzeln bearbeitbar, mit Farbwähler |
| 🛠️ **Erweitert** | Sonnen-Entität, Stundenwert für 7/14 Tage, Aktualisierung, Standort, Umrechnungsfaktor |

Listen (Anlagen, Modulfelder, Farbstufen) lassen sich hinzufügen, entfernen und mit ↑ ↓ sortieren. In die YAML schreibt der Editor nur Werte, die vom Standard abweichen.

---

## Die vier Ansichten

| Ansicht | Darstellung | Legende | Wofür? |
|---|---|---|---|
| **Zeit** | Anteil der Sonnenzeit aus dieser Richtung | Zeitanteil je Leistungsklasse | Wann steht die Sonne wo, und wie viel kommt dabei an? |
| **Ertrag** | Anteil am Ertrag (kWh) aus dieser Richtung | Ertragsanteil je Leistungsklasse | Aus welcher Richtung kommt meine Energie? |
| **Ø Leistung** | Durchschnittsleistung bei Sonne aus dieser Richtung | Zeitanteil je Leistungsklasse | Welche Richtung liefert im Schnitt am meisten? |
| **Schatten** | Raster aus Richtung × Sonnenhöhe (Rand = Horizont, Mitte = Zenit), Farbe = Ø Leistung | Zeitanteil je Leistungsklasse | Bei welchem Sonnenstand gibt es Schatten? |

Gezählt wird nur die Zeit, in der die Sonne über dem Horizont steht.

**Tipp für die Schatten-Ansicht:** Wähle **1 Jahr**, damit möglichst viele Sonnenstände vorkommen. Ein Bereich, der dunkler ist als seine Nachbarn bei gleicher Höhe, deutet auf Verschattung hin. Typisch sind tief stehende Sonne im Winter und Bäume im Südwesten.

---

## Sonnenbahnen

Die Karte zeichnet über die Rose:

- **Heute** (orange): mit Stundenpunkten, Uhrzeiten alle 3 Stunden sowie Auf- ↑ und Untergang ↓ mit Uhrzeit.
- **21.6.** (gelb, gestrichelt): längster Tag, höchste Sonnenbahn.
- **21.12.** (blau, gestrichelt): kürzester Tag, niedrigste Sonnenbahn.
- **Sonne jetzt:** als leuchtender Punkt auf der heutigen Bahn.

Bei den Bahnen gilt: Abstand zur Mitte = Sonnenhöhe (Rand = Horizont, Mitte = Zenit). Zusammen mit dem Hausbild siehst du, welche Dachfläche zu welcher Jahreszeit wann Sonne bekommt. Fährst du über eine Bahn, erscheinen Auf- und Untergang, Richtung und Mittagshöhe.

```yaml
show_sun_paths: true
sun_paths: [today, summer, winter]
```

---

## Lange Zeiträume & Jahreszeiten

| Button | Zeitraum |
|---|---|
| 30 Tage | die letzten 30 Tage |
| 1 Jahr | die letzten 365 Tage |
| Sommer | April bis September der letzten 12 Monate |
| Winter | Oktober bis März der letzten 12 Monate |

Bei **Sommer** und **Winter** erscheint die jeweils andere Jahreszeit als **gestrichelter Umriss** zum Vergleich (`season_overlay`). Alle Zeiträume ab 7 Tagen nutzen die Langzeitstatistiken, die Home Assistant dauerhaft speichert. 1 Jahr, Sommer und Winter teilen sich dieselben Daten und laden nur einmal.

---

## Ertrag pro kWp

Gibst du die Anlagenleistung in kWp an, zeigt die Karte den **spezifischen Ertrag** in kWh/kWp:

- Bei **Ertrag** steht er unter dem Ertrag der gewählten Anlage.
- Bei mehreren Anlagen erscheint unter den Kennzahlen ein Vergleich, z. B. *Spezifischer Ertrag (1 Jahr): BKW 980 · Dach 1.050 · Gesamt 1.040 kWh/kWp*.

```yaml
sources:
  - {name: BKW, entity: sensor.bkw_leistung, max_power: 800, kwp: 0.8}
  - {name: Dach, entity: sensor.dach_leistung, max_power: 8000, kwp: 6.0}
```

Ohne `kwp` nimmt die Karte die Summe der `kwp`-Angaben aus den Modulfeldern der Anlage. Bei nur einem Sensor gibt es `kwp` auf oberster Ebene.

---

## Mehrere Anlagen

Statt `power_entity` gibst du eine Liste `sources` an, im Editor unter **🔆 Anlagen**. Über der Rose erscheint dann ein Umschalter, z. B. **BKW | Dach | Gesamt**.

```yaml
type: custom:helios-compass-card
title: Helios Compass Card
sources:
  - name: BKW
    entity: sensor.bkw_leistung
    max_power: 800
    modules:
      - {name: Balkon, azimuth: 195, tilt: 90}
  - name: Dach
    entity: sensor.dach_leistung
    max_power: 8000
    modules:
      - {name: Dach Ost, azimuth: 110, tilt: 35, color: '#e040fb'}
      - {name: Dach West, azimuth: 290, tilt: 35, color: '#00e5ff'}
show_total: true
total_name: Gesamt
default_source: total
```

- Jede Anlage hat eine eigene Leistungsskala, eigene Farbstufen und eigene Modulpfeile.
- **Gesamt** summiert alle Anlagen. Die Skala ergibt sich automatisch aus der Summe der `max_power`, gerundet.
- Die Ecke oben links (`type: source`) zeigt immer die Leistung der gewählten Anlage, z. B. „BKW-Leistung“, „Dach-Leistung“ oder „Gesamt-Leistung“.

---

## Hausbild ausrichten

Ein Luftbild (Drohne, Satellit, Screenshot aus einer Karten-App) legst du z. B. nach `/config/www/helios/haus.png`. Es ist dann unter `/local/helios/haus.png` erreichbar. Das Bild ist optional, ohne Bild bleibt die Mitte frei.

So richtest du es im Editor unter **🏠 Hausbild** aus:

1. **Drehung:** So drehen, dass Norden oben ist. In Google Maps ist Norden immer oben, dort siehst du die richtige Lage deines Hauses.
2. **Verschieben:** Das Haus genau in die Mitte des Kompasses setzen.
3. **Bildgröße:** passend skalieren.
4. **Rund zuschneiden:** damit nichts über den Kompass hinausragt.

```yaml
image: /local/helios/haus.png
image_rotation: -32.5
image_offset_x: 4
image_offset_y: -6
image_scale: 1.1
image_clip: true
```

---

## Modulausrichtung

```yaml
modules:
  - name: Balkon
    azimuth: 195     # 90 = Ost, 180 = Süd, 270 = West
    tilt: 90         # Neigung in Grad (optional)
    kwp: 0.8         # optional, erscheint im Tooltip
    color: '#ff9800' # optional
```

Globale `modules` erscheinen bei jeder Anlage. Modulfelder innerhalb einer Anlage erscheinen nur bei dieser Anlage und bei „Gesamt“.

---

## Leistungsklassen & Farben

Ohne Angabe gibt es 9 Farbstufen von 0 bis `max_power`. Eigene Stufen:

```yaml
color_stops:
  - {value: 0, color: '#1e40af'}
  - {value: 200, color: '#22c55e'}
  - {value: 500, color: '#facc15'}
  - {value: 700, color: '#dc2626'}
```

Jede Stufe beginnt bei `value` und reicht bis zur nächsten Stufe. Die letzte Stufe gilt ab ihrem Wert aufwärts.

---

## Werte in den Ecken

```yaml
corners:
  top_left:     {type: source}                       # Leistung der gewählten Anlage
  top_right:    {type: azimuth, name: Sonnenazimut}
  bottom_left:  {type: elevation, name: Sonnenhöhe}
  bottom_right: {entity: sensor.tagesertrag, name: Heute, unit: ' kWh', decimals: 2}
```

| Typ | Anzeige |
|---|---|
| `type: source` | Leistung der gewählten Anlage (bei „Gesamt“ die Summe) |
| `entity: …` | beliebige Entität, optional mit `unit` und `decimals` |
| `type: azimuth` | aktueller Sonnenazimut |
| `type: elevation` | aktuelle Sonnenhöhe |
| `null` | Ecke ausblenden |

`name` ist immer optional.

Die Standardbelegung: oben links die Leistung der gewählten Anlage, oben rechts der Sonnenazimut, unten links die Sonnenhöhe, unten rechts leer.

---

## Alle Optionen

### Allgemein & Darstellung

| Option | Standard | Beschreibung |
|---|---|---|
| `power_entity` | **Pflicht**¹ | Leistungssensor in W oder kW, wird automatisch umgerechnet |
| `title` | `Helios Compass Card` | Kartentitel, `""` blendet ihn aus |
| `max_power` | `8000` | Obergrenze der Leistungsklassen in W, z. B. `800` für ein BKW |
| `legend_label` | `PV-Leistung` | Beschriftung der Farbskala |
| `kwp` | Summe aus `modules` | Anlagenleistung für kWh/kWp (bei nur einem Sensor) |
| `metric` | `time` | Standard-Ansicht: `time`, `energy`, `avg_power` oder `shading` |
| `show_metric_switch` | `true` | Umschalter Zeit / Ertrag / Ø Leistung / Schatten anzeigen |
| `show_stats` | `true` | Kennzahlen-Zeile anzeigen |
| `show_legend` | `true` | Farbskala anzeigen |
| `ranges` | alle | angezeigte Zeitraum-Buttons: `1h`, `8h`, `12h`, `24h`, `7d`, `14d`, `30d`, `1y`, `summer`, `winter` |
| `season_overlay` | `true` | bei Sommer/Winter die andere Jahreszeit gestrichelt zeigen |
| `show_sun_paths` | `true` | Sonnenbahnen einzeichnen |
| `sun_paths` | `[today, summer, winter]` | welche Bahnen: heute, 21.6., 21.12. |
| `elevation_bands` | `9` | Schatten-Ansicht: Anzahl Höhenringe (9 = 10°) |
| `default_range` | `8h` | Start-Zeitraum |
| `sectors` | `36` | Anzahl Richtungssektoren (36 = 10° breit, 16 = Kompassrichtungen) |
| `sector_opacity` | `0.8` | Deckkraft der Sektoren |
| `color_stops` | 9 Stufen bis `max_power` | Liste aus `{value, color}` |
| `modules` | – | Modulfelder für alle Anlagen |
| `corners` | siehe oben | Werte in den vier Ecken |

¹ Entfällt, wenn `sources` genutzt wird.

### Hausbild

| Option | Standard | Beschreibung |
|---|---|---|
| `image` | – | Pfad zum Hausbild (optional) |
| `image_scale` | `0.8` | Bildgröße relativ zum Kompass |
| `image_rotation` | `0` | Drehung in Grad, positiv = im Uhrzeigersinn |
| `image_offset_x` | `0` | Verschieben in % des Kompassradius, + = rechts (Osten) |
| `image_offset_y` | `0` | Verschieben in % des Kompassradius, + = oben (Norden) |
| `image_opacity` | `1` | Deckkraft des Bildes |
| `image_clip` | `false` | Bild rund auf den Kompass zuschneiden |

### Mehrere Anlagen

| Option | Standard | Beschreibung |
|---|---|---|
| `sources` | – | Liste der Anlagen, siehe unten |
| `show_total` | `true` | „Gesamt“ als Summe anzeigen (bei mehreren Anlagen) |
| `total_name` | `Gesamt` | Bezeichnung der Summe |
| `total_max_power` | automatisch | Skala für „Gesamt“ |
| `total_color_stops` | automatisch | Farbstufen für „Gesamt“ |
| `default_source` | erste Anlage | Start-Anlage: Entität oder `total` |

**Je Anlage in `sources`:**

| Option | Beschreibung |
|---|---|
| `entity` | **Pflicht**, Leistungssensor (W oder kW) |
| `name` | Name im Umschalter und in der Legende |
| `max_power` | Obergrenze der Leistungsklassen dieser Anlage |
| `kwp` | Anlagenleistung in kWp (für kWh/kWp) |
| `color_stops` | eigene Farbstufen |
| `modules` | eigene Modulfelder |
| `legend_label` | eigene Beschriftung der Farbskala |

### Erweitert

| Option | Standard | Beschreibung |
|---|---|---|
| `sun_entity` | `sun.sun` | Quelle für den aktuellen Sonnenstand |
| `stats_type` | `mean` | ab 7 Tagen: Stundenmittel (`mean`) oder Spitze (`max`) |
| `refresh_interval` | `300` | Verlauf neu laden alle x Sekunden |
| `latitude` / `longitude` | HA-Standort | Standort überschreiben |
| `unit_factor` | automatisch | Umrechnungsfaktor auf W, nur nötig bei ungewöhnlichen Einheiten |

---

## Update-Benachrichtigung

Wenn du die Karte über HACS installiert hast, erscheinen neue Versionen automatisch unter **Einstellungen → Updates** und in HACS.

Optional bekommst du eine Push-Nachricht aufs Handy. Den genauen Namen der Update-Entität findest du unter Einstellungen → Entitäten mit der Suche nach „helios“.

```yaml
alias: Helios Compass Card – Update verfügbar
triggers:
  - trigger: state
    entity_id: update.helios_compass_card_update
    to: "on"
actions:
  - action: notify.mobile_app_DEIN_HANDY
    data:
      title: "☀️ Helios Compass Card"
      message: >
        Version {{ state_attr('update.helios_compass_card_update', 'latest_version') }} ist verfügbar.
      data:
        url: /config/updates
        clickAction: /config/updates
mode: single
```

---

## Hinweise & Fehlerbehebung

- **„Custom element doesn't exist: helios-compass-card“:** Die JS-Datei wurde nicht geladen.
  - Prüfe, ob `/hacsfiles/helios-compass-card/helios-compass-card.js` im Browser Code anzeigt.
  - Prüfe, ob die Ressource unter Einstellungen → Dashboards → Ressourcen eingetragen ist.
  - Lade danach mit Strg+F5 neu.
- **Zeiträume ab 7 Tagen** nutzen die Langzeitstatistiken. Der Sensor braucht dafür `state_class: measurement`. Fehlen sie, nutzt die Karte den normalen Verlauf, soweit der Recorder so weit zurückreicht.
- **1 bis 24 Stunden** stammen aus dem Recorder-Verlauf mit 1- bzw. 5-Minuten-Auflösung.
- Den **Ertrag** berechnet die Karte aus dem Leistungsverlauf. Er kann daher leicht vom Zählerstand des Wechselrichters abweichen.
- Ab 7 Tagen ist die **Spitze für „Gesamt“** eine obere Abschätzung, weil stündliche Höchstwerte addiert werden.
- Die Zahlen sind deutsch formatiert. Die Karte unterstützt den hellen und dunklen Modus über die Theme-Farben von Home Assistant.

---

## Changelog

| Version | Änderungen |
|---|---|
| **1.6.0** | Sonnenbahnen (heute mit Auf-/Untergang, 21.6., 21.12.); Ansicht „Schatten“ (Richtung × Sonnenhöhe); Zeiträume 30 Tage, 1 Jahr, Sommer, Winter mit Vergleich; kWp je Anlage und spezifischer Ertrag kWh/kWp |
| **1.5.1** | Die Ecke oben links folgt bei mehreren Anlagen automatisch der Auswahl, auch bei älteren Konfigurationen |
| **1.5.0** | Grafischer Editor für alle Optionen: Listen für Anlagen, Modulfelder und Farbstufen mit Farbwähler; Ecken mit Einheit und Nachkommastellen |
| **1.4.0** | Hausbild verschieben und rund zuschneiden, feinere Drehung; Zeitraum 12 Std.; Name „Helios Compass Card“ |
| **1.3.0** | Mehrere Anlagen mit Umschalter und Summe „Gesamt“; Anzeige in kW ab 1000 W |
| **1.2.1** | Ringbeschriftung passt sich ohne Hausbild an |
| **1.2.0** | Ansichten Zeit / Ertrag / Ø Leistung, Kennzahlen, Modulausrichtung, erster grafischer Editor |
| **1.1.0** | Solarrose mit Sektoren statt Punkten |
| **1.0.0** | Erste Version |
