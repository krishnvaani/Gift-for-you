
document.addEventListener('DOMContentLoaded', function(){
  console.log('script loaded');
  // minimal required bindings for login
  document.getElementById('loginToggle').addEventListener('click', function(){ document.getElementById('loginModal').classList.remove('hidden'); });
  document.getElementById('closeLogin').addEventListener('click', function(){ document.getElementById('loginModal').classList.add('hidden'); });
  document.getElementById('doLogin').addEventListener('click', function(){
    var name = document.getElementById('loginName').value.trim();
    var role = document.getElementById('loginRole').value;
    var pass = document.getElementById('loginPass').value;
    if(!name){ alert('Enter a name'); return; }
    if(role==='admin' && pass!=='admin'){ alert('Wrong admin password'); return; }
    if(role==='receiver' && pass!=='receiver'){ alert('Wrong receiver password'); return; }
    document.getElementById('userLabel').innerText = name + ' ('+role+')';
    document.getElementById('loginName').value=''; document.getElementById('loginPass').value='';
    document.getElementById('loginModal').classList.add('hidden');
    document.getElementById('app').classList.remove('hidden');
    alert('Logged in as '+role);
  });
});
