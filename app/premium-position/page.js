import { headers } from 'next/headers'
import PremiumPositionPage from './PremiumPositionClient'

const regenerateScript = `
(function() {
  function addRegenButton() {
    // Find the action plan heading
    var headings = document.querySelectorAll('h3');
    var planHeading = null;
    for (var i = 0; i < headings.length; i++) {
      if (headings[i].textContent.includes('Action Plan')) {
        planHeading = headings[i];
        break;
      }
    }
    if (!planHeading) return false;

    // Check if button already exists
    if (document.getElementById('regen-btn')) return true;

    // Find the plan container (gold bordered div)
    var planCard = planHeading.closest('[class*="border-gold"]');
    if (!planCard) return false;

    // Create the button container
    var container = document.createElement('div');
    container.style.cssText = 'text-align:center;margin-bottom:1.5rem;';
    container.id = 'regen-btn';

    var btn = document.createElement('button');
    btn.textContent = 'Regenerate My Positioning Action Plan';
    btn.style.cssText = 'padding:12px 24px;background:#27272a;color:#d4a843;border:1px solid rgba(212,168,67,0.3);font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:0.05em;border-radius:8px;cursor:pointer;transition:background 0.2s;';
    btn.onmouseover = function() { btn.style.background = '#3f3f46'; };
    btn.onmouseout = function() { btn.style.background = '#27272a'; };

    var hint = document.createElement('p');
    hint.textContent = 'Updated your answers? Hit regenerate to refresh your plan.';
    hint.style.cssText = 'color:#52525b;font-size:12px;margin-top:8px;';

    btn.onclick = async function() {
      btn.textContent = 'Generating your plan...';
      btn.disabled = true;
      btn.style.opacity = '0.5';
      try {
        // Gather data from the page's React fiber
        var res = await fetch('/api/generate-plan', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'premium-position', data: window.__regenData || {} }),
        });
        var result = await res.json();
        if (result.error) { alert('Failed: ' + result.error); }
        else {
          // Update the plan text on screen
          var planText = planCard.querySelector('[class*="whitespace-pre-wrap"]');
          if (planText) planText.textContent = result.plan;
          // Save to Supabase via the existing client
          if (window.__regenSave) window.__regenSave(result.plan);
        }
      } catch(e) { alert('Failed: ' + e.message); }
      btn.textContent = 'Regenerate My Positioning Action Plan';
      btn.disabled = false;
      btn.style.opacity = '1';
    };

    container.appendChild(btn);
    container.appendChild(hint);
    planCard.parentNode.insertBefore(container, planCard);
    return true;
  }

  // Poll until the plan heading appears (React renders async)
  var attempts = 0;
  var interval = setInterval(function() {
    if (addRegenButton() || attempts > 100) clearInterval(interval);
    attempts++;
  }, 500);

  // Also watch for navigation/re-renders
  var observer = new MutationObserver(function() { addRegenButton(); });
  observer.observe(document.body, { childList: true, subtree: true });
})();
`

export default async function Page() {
  await headers()
  return (
    <>
      <PremiumPositionPage />
      <script dangerouslySetInnerHTML={{ __html: regenerateScript }} />
    </>
  )
}
