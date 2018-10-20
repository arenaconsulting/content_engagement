# Content Engagement
A script to measure the level of engagement on your content pages made by Arena Data Consulting AS.  
It is set up for use with Tealium IQ, but can be configured to work with any other TMS.

## Installation
1. Add the script through your TMS of choice and scope the script to run at DOM ready.
2. Configure the CSS selectors needed to define the content area on the page.
```javascript
const ARTICLE_SELECTOR = '.main-content', // Find the CSS selector in your source code
      HEADER_SELECTOR = '.header-content';
```

## Usage
The script defines two metrics
1. *Medium engaged*  
  Sends an event at 40% scroll and 25% of the estimated reading time.
2. *Fully engaged*  
  Sends an event at 70% scroll and 50% of the estimated reading time.  
  
The events are formatted as follows:
```javascript
// Medium engagement
{
  event_category: "Content engagement",
  event_action: "Medium engagement",
  event_label: "<NAME_OF_ARTICLE>"
}  

// Full engagement
{
  event_category: "Content engagement",
  event_action: "Full engagement",
  event_label: "<NAME_OF_ARTICLE>"
}
```

