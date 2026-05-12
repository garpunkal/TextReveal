# Text Reveal


## Screenshot

Below is an example of the text reveal effect in action:

![Text Reveal Demo](screenshots/image.png)

---

## How to Set Up a Text Reveal Section

To add a text reveal effect to your page, use the following HTML structure:

```html
<section class="text-reveal-container" data-bg="#000000">
   <div class="container">
      <p class="text-reveal" data-revealed="#ffffff" data-unrevealed="#333333" data-highlight="#32CD32" data-highlight-unrevealed="#333333" data-dot>
         Like a curtain rising on a stage, the text is <span>gradually illuminated</span> as you scroll,
         transforming plain
         letters into a <span>dazzling display of color</span> and motion
      </p>
   </div>
</section>
```


**Attributes:**
- `data-bg`: Background color for the section.
- `data-revealed`: Color of the revealed text.
- `data-unrevealed`: Color of the unrevealed text.
- `data-highlight`: Color for highlighted text (inside `<span>` tags).
- `data-highlight-unrevealed`: (Optional) Color for the unrevealed part of highlighted text and dot. Defaults to `data-unrevealed`.
- `data-dot`: (Optional) Enables the animated dot effect.
- `data-start`: (Optional) Percentage (0–1) of scroll before reveal starts (controls the animation start percentage). Default is `0.1` (10%).
- `data-fill`: (Optional) Percentage (0–1) of scroll over which the reveal completes. Default is `0.4` (40%).
- `data-fill-start`: (Optional) Initial fill percentage when the animation starts (e.g., `0.25` means 25% revealed at start).

### Examples

Start reveal at 30% scroll:
```html
<p class="text-reveal" data-revealed="#fff" data-unrevealed="#888" data-highlight="#FFD600" data-start="0.3">
   This text reveal starts when the element is <span>30%</span> into the scroll window.
</p>
```

Fill slowly over 80% of scroll:
```html
<p class="text-reveal" data-revealed="#fff" data-unrevealed="#888" data-highlight="#FFD600" data-fill="0.8">
   This text reveal fills up <span>slowly</span>, taking 80% of the scroll window to complete.
</p>
```

Start partially filled:
```html
<p class="text-reveal" data-revealed="#fff" data-unrevealed="#888" data-highlight="#FFD600" data-fill-start="0.25" data-fill="0.5">
   At animation start this is already <span>25%</span> filled, and it reaches full fill after <span>50%</span> more scroll progress.
</p>
```

Start late (50%) and fill quickly (20%):
```html
<p class="text-reveal" data-revealed="#fff" data-unrevealed="#888" data-highlight="#FFD600" data-start="0.5" data-fill="0.2">
   This reveal starts <span>late</span> and fills <span>quickly</span>.
</p>
```

You can customize the text, colors, and reveal timing as needed. Place these sections anywhere in your HTML to create scroll-activated text reveal effects.

## License
This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.