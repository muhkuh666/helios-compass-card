# ☀️ Helios Compass

**PV-Sonnenkompass für Home Assistant.** Zeigt den aktuellen Sonnenstand (Azimut und Höhe) und deine PV-Leistung als **Solarrose** (wie eine Windrose) über einem Luftbild deines Hauses: Jeder Sektor ist eine Sonnenrichtung, seine Länge zeigt den Zeitanteil in %, die Farben die Leistungsklassen. So siehst du auf einen Blick, aus welcher Himmelsrichtung deine Anlage wie viel liefert.

- 16-teilige Kompassrose (N, NNO, NO … NNW)
- Sonnenmarker (orange bei Tag, grau bei Nacht)
- Gestapelte Sektoren je Leistungsklasse, Ringskala in % passt sich automatisch an
- Legende mit Zeitanteil je Leistungsklasse, aktuelle Klasse ist umrandet
- Verlauf für 1 Std., 8 Std., 24 Std., 7 Tage und 14 Tage (Auswahl wird gemerkt)
- Leistungsklassen frei einstellbar (Standard: 9 Stufen bis `max_power`)
- Eigenes Hausbild (Drohnen-/Satellitenbild), drehbar und skalierbar
- Tooltips mit Richtung, Zeitanteil und Leistungsklasse beim Überfahren der Sektoren
- **Drei Ansichten** per Umschalter: *Zeit* (wie lange kam die Sonne aus welcher Richtung), *Ertrag* (wie viel kWh kamen aus welcher Richtung), *Ø Leistung* (Durchschnittsleistung je Richtung, zeigt Verschattung)
- **Kennzahlen**: Ertrag im Zeitraum, Spitzenleistung mit Zeitpunkt und Richtung, beste Richtung
- **Modulausrichtung**: gestrichelte Pfeile mit Name und Neigung für jedes Modulfeld
- **Grafischer Editor**: alles im Dashboard-Editor einstellbar, YAML ist optional
- Klick auf einen Wert öffnet die Detailansicht der Entität

Der Sonnenstand für den Verlauf wird aus deinem Home-Assistant-Standort berechnet. Du brauchst also nur den PV-Leistungssensor.

## Installation

**HACS (benutzerdefiniertes Repository)**
1. Ordner in ein GitHub-Repo legen.
2. HACS → ⋮ → *Benutzerdefinierte Repositories* → Repo-URL, Typ **Dashboard**.
3. „Helios Compass“ installieren und Browser neu laden.

**Manuell**
1. `helios-compass-card.js` nach `/config/www/` kopieren.
2. *Einstellungen → Dashboards → ⋮ → Ressourcen → Ressource hinzufügen*:
   URL `/local/helios-compass-card.js`, Typ **JavaScript-Modul**.
3. Browser-Cache leeren (Strg+F5).

**Hausbild (optional):** Die Karte funktioniert auch ohne Bild, dann bleibt die Mitte frei. Wenn du eins möchtest, leg es nach `/config/www/helios/haus.png`. Es ist dann unter `/local/helios/haus.png` erreichbar. Das Bild sollte genordet sein (Norden oben), sonst mit `image_rotation` korrigieren.

## Konfiguration

Beispiel Balkonkraftwerk:

```yaml
type: custom:helios-compass-card
title: BKW-Solarrose
power_entity: sensor.bkw_leistung
max_power: 800
legend_label: BKW-Leistung
image: /local/helios/haus.png
corners:
  top_left: {entity: sensor.bkw_leistung, name: BKW-Leistung}
  bottom_right: {entity: sensor.bkw_leistung, name: BKW-Leistung}
```

Beispiel große Anlage:

```yaml
type: custom:helios-compass-card
title: PV-Solarrose
power_entity: sensor.pv_leistung
max_power: 8000
image: /local/helios/haus.png
image_scale: 0.8
corners:
  bottom_right:
    entity: sensor.pv_string2_leistung
    name: PV-Leistung
```

| Option | Standard | Beschreibung |
|---|---|---|
| `power_entity` | **Pflicht** | PV-Leistungssensor (W oder kW, wird automatisch umgerechnet) |
| `title` | `Helios Compass` | Kartentitel (`""` blendet ihn aus) |
| `max_power` | `8000` | Obergrenze der Leistungsklassen in W (z. B. `800` für ein Balkonkraftwerk) |
| `metric` | `time` | Standard-Ansicht: `time`, `energy` oder `avg_power` |
| `show_metric_switch` | `true` | Umschalter Zeit / Ertrag / Ø Leistung anzeigen (Auswahl wird gemerkt) |
| `show_stats` | `true` | Kennzahlen-Zeile anzeigen |
| `modules` | – | Modulfelder, siehe unten |
| `sectors` | `36` | Anzahl der Richtungssektoren (36 = 10° breit, 16 = Kompassrichtungen) |
| `sector_opacity` | `0.8` | Deckkraft der Sektoren |
| `image` | – | Pfad zum Hausbild (optional, ohne Bild bleibt die Mitte frei) |
| `image_scale` | `0.8` | Bildgröße relativ zum Kompass |
| `image_rotation` | `0` | Drehung des Bildes in Grad |
| `image_opacity` | `1` | Deckkraft des Bildes |
| `ranges` | `[1h, 8h, 24h, 7d, 14d]` | Angezeigte Zeitraum-Buttons |
| `default_range` | `8h` | Start-Zeitraum |
| `sun_entity` | `sun.sun` | Quelle für den aktuellen Sonnenstand |
| `stats_type` | `mean` | Für 7/14 Tage: Stundenmittel (`mean`) oder Spitze (`max`) |
| `refresh_interval` | `300` | Neuladen des Verlaufs in Sekunden |
| `show_legend` | `true` | Farbskala anzeigen |
| `legend_label` | `PV-Leistung` | Beschriftung der Farbskala |
| `color_stops` | 9 Stufen bis `max_power` | Liste aus `{value, color}` |
| `corners` | siehe unten | Werte in den vier Ecken |
| `latitude` / `longitude` | HA-Standort | Standort überschreiben |
| `unit_factor` | auto | Manueller Umrechnungsfaktor auf W |

**Ecken** (`top_left`, `top_right`, `bottom_left`, `bottom_right`): entweder `entity` (+ optional `name`, `unit`, `decimals`) oder `type: azimuth` bzw. `type: elevation`. Standard: links oben PV-Leistung, rechts oben Sonnenazimut, links unten Sonnenhöhe, rechts unten leer. Mit `null` blendest du eine Ecke aus.

**Modulausrichtung**
```yaml
modules:
  - name: Balkon
    azimuth: 195   # 180 = Süd, 90 = Ost, 270 = West
    tilt: 90       # Neigung in Grad (optional)
    kwp: 0.8       # optional, erscheint im Tooltip
    color: '#ff9800'
  - name: Garage
    azimuth: 120
    tilt: 15
    color: '#e040fb'
```

**Eigene Farbskala**
```yaml
color_stops:
  - {value: 0, color: '#1e40af'}
  - {value: 2000, color: '#22c55e'}
  - {value: 5000, color: '#facc15'}
  - {value: 7000, color: '#dc2626'}
```

## Hinweise
- Die Kennzahl *Ertrag* wird aus dem Leistungsverlauf berechnet (bei 7/14 Tagen aus Stundenmitteln). Sie kann daher leicht vom Zählerstand des Wechselrichters abweichen.
- Gezählt wird nur die Zeit, in der die Sonne über dem Horizont steht. Die Prozente beziehen sich auf diese Sonnenzeit im gewählten Zeitraum.
- Für **7 und 14 Tage** werden die Langzeitstatistiken genutzt. Der Sensor braucht dafür `state_class: measurement` (bei fast allen Wechselrichter-Integrationen gesetzt). Fehlen sie, fällt die Karte auf den normalen Verlauf zurück (sofern der Recorder so weit zurückreicht).
- 1/8/24 Std. kommen aus dem Recorder-Verlauf mit 1- bzw. 5-Minuten-Auflösung.
