// Closes the homepage's "more" (details/summary) menu when a click lands
// outside it -- native <details> only closes on re-clicking <summary>.
document.querySelectorAll('details.more').forEach((el) => {
  document.addEventListener('click', (e) => {
    if (el.hasAttribute('open') && !el.contains(e.target)) {
      el.removeAttribute('open');
    }
  });
});
