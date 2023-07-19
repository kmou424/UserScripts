const Templates = {
  SCRIPT_OPEN_HYPERLINK: `
function CustomOpenNewHyperlink(event, url, openWindow) {
    event.preventDefault();
    if (openWindow) {
        window.open(url);
    } else {
        window.location.href = url;
    }
}
`
};

export default Templates;