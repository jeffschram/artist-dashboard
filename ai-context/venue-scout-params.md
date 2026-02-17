# Venue Scout - Search Parameters

## Artist Profile

- **Artist:** Holly Danger
- **Medium:** Video projection, immersive installation, new media art
- **Keywords:** projection mapping, immersive experience, interactive installation, digital art, time-based media, light art, audiovisual, multimedia

## Venue Types to Search For

### High Priority
- Museums and galleries with new media / digital art programs
- Immersive art spaces and experience centers (e.g., ARTECHOUSE, Meow Wolf-style)
- Art and technology centers / media art institutions
- Contemporary art museums with time-based media collections
- Artist residency programs that support technology-based or installation work
- Projection mapping festivals and events

### Medium Priority
- Alternative / unconventional exhibition spaces (warehouses, historic buildings)
- Science museums or planetariums with art programming
- University galleries with new media or MFA exhibition programs
- Corporate or public art commissioning programs
- Light festivals and nighttime art events (e.g., BLINK, Vivid Sydney)

### Lower Priority (but still worth flagging)
- Music festivals with visual art / installation components
- Architecture firms or real estate developers commissioning immersive experiences
- Experiential marketing agencies seeking installation artists

## Geographic Focus

- **Primary:** United States (all major cities, with emphasis on NYC, LA, Chicago, Houston, Miami, DC, SF, Denver, Austin, Phoenix, Philadelphia, Boston, Seattle, Portland, Minneapolis)
- **Secondary:** International -- especially:
  - Europe (Germany, Austria, Netherlands, UK, France)
  - Japan
  - Australia
  - Canada

## Search Query Templates

The agent should construct Brave Search queries by combining these patterns:

1. `"immersive art" + "open call" + [city/region]`
2. `"projection mapping" + "artist submissions" + [year]`
3. `"new media art" + "exhibition opportunity" + [city/region]`
4. `"digital art" + "residency" + "accepting applications"`
5. `"light festival" + "call for artists" + [year]`
6. `"immersive experience" + "artist" + "commission" + [city/region]`
7. `"time-based media" + "gallery" + "submissions"`
8. `"video art" + "installation" + "open call" + [year]`
9. `"art and technology" + "residency" OR "exhibition" + [city/region]`
10. `"projection art" + "festival" + [year]`

## Qualification Criteria (What Makes a Good Venue)

A result qualifies as a venue opportunity if it meets ALL of these:

1. **Is an actual venue, institution, festival, or program** -- not a news article, blog post, or directory listing
2. **Hosts or commissions visual/installation/immersive art** -- not purely performing arts (theater, dance) unless they also feature installation work
3. **Has a physical presence or event** -- not purely online/virtual galleries
4. **Appears to accept external artists** -- has open calls, submission forms, residency applications, or a curatorial contact

A result is BONUS if it also:
- Has an active open call or upcoming deadline
- Specifically mentions new media, projection, immersive, or digital art
- Has previously shown work similar to video projection installations
- Has a submission form URL or direct curator contact

## Disqualification Criteria (Filter Out)

- News articles or press coverage about venues (we want the venue itself)
- Social media posts or personal blogs
- Venues that only show traditional media (painting, sculpture) with no history of installation/new media
- Closed or defunct spaces
- Venues already in the database (deduplicate by name)
- Generic event listing aggregators (e.g., Eventbrite, Meetup)
- Art supply stores, equipment rental, or production companies

## Output Format

For each qualifying venue, the agent should extract:

- **name** -- Venue/institution name
- **url** -- Website URL
- **city, state, country** -- Location
- **notes** -- Brief description of why it's relevant (1-2 sentences), including any open call deadlines if found
- **submissionFormUrl** -- Direct link to submission/application form if available
