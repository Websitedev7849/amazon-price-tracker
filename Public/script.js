const startInterval = document.querySelector('#start-interval');

startInterval.addEventListener('click', () => {
    let options = {
        method: 'POST'
    }
    fetch('/start-interval', options)
    .then(res => res.body)
    .then(data => {
        window.alert('interval trigerred');
    });
});