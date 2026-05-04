(function () {
  // Always use dark mode
  document.documentElement.classList.add('dark');

  function getBasePath() {
    var pathname = window.location.pathname;

    if (pathname.indexOf('/document/') !== -1) {
      return pathname.split('/document/')[0] + '/';
    }

    if (pathname.indexOf('/templates/') !== -1) {
      return pathname.split('/templates/')[0] + '/';
    }

    return pathname.replace(/[^/]*$/, '/');
  }

  function normalizePath(pathname) {
    return pathname.replace(/\/+/g, '/').replace(/\/index\.html$/, '/').replace(/\/$/, '');
  }

  function createLink(basePath, href, label) {
    var a = document.createElement('a');
    a.href = basePath + href;
    a.textContent = label;
    return a;
  }

  function getConfig() {
    if (window.SIDEBAR_CONFIG && Array.isArray(window.SIDEBAR_CONFIG.groups)) {
      return window.SIDEBAR_CONFIG;
    }

    return {
      topLinks: [
        ['index.html', 'Home']
      ],
      groups: [
        {
          key: 'culture',
          title: 'Culture',
          links: [
            ['document/culture/index.html', 'Index'],
            ['document/culture/oyakaku.html', 'Oyakaku'],
            ['document/culture/read-the-air.html', 'Read The Air']
          ]
        },
        {
          key: 'device',
          title: 'Device',
          links: [
            ['document/device/index.html', 'Index'],
            ['document/device/browser.html', 'Browser'],
            ['document/device/pc-smartphone.html', 'PC & Smartphone'],
            ['document/device/entertainment.html', 'Entertainment']
          ]
        },
        {
          key: 'education',
          title: 'Education',
          links: [
            ['document/education/index.html', 'Index'],
            ['document/education/english-education-japan.html', 'English Education'],
            ['document/education/general-subjects.html', 'General Subjects'],
            ['document/education/multiple-language-education.html', 'Multiple Language'],
            ['document/education/harmony-is-valued.html', 'Discussion Culture']
          ]
        },
        {
          key: 'jp-learning',
          title: 'JP Learning',
          links: [
            ['document/jp-learning/index.html', 'Index'],
            ['document/jp-learning/greeting.html', 'Greetings'],
            ['document/jp-learning/call-someone.html', 'How to Call Someone'],
            ['document/jp-learning/call-yourself.html', 'How to Call Yourself']
          ]
        },
        {
          key: 'life',
          title: 'Life',
          links: [
            ['document/life/index.html', 'Index'],
            ['document/life/faq.html', 'FAQ'],
            ['document/life/foreign.html', 'Overseas Travel'],
            ['document/life/investment.html', 'Investment'],
            ['document/life/living-in-japan-with-limited-japanese.html', 'Limited Japanese'],
            ['document/life/rubbish-disposal.html', 'Garbage Disposal'],
            ['document/life/quiet-areas-near-tokyo.html', 'Quiet Areas Near Tokyo'],
            ['document/life/rent-rooms.html', 'Renting Rooms']
          ]
        },
        {
          key: 'work',
          title: 'Work',
          links: [
            ['document/work/index.html', 'Index'],
            ['document/work/internship.html', 'Why No Internships'],
            ['document/work/general.html', 'No Work Experience'],
            ['document/work/hardship-to-work-in-foreign-country.html', 'Working Abroad'],
            ['document/work/it-company.html', 'IT Company'],
            ['document/work/black-company.html', 'Black Company']
          ]
        }
      ]
    };
  }

  var basePath = getBasePath();
  var current = normalizePath(window.location.pathname);
  var config = getConfig();
  var groups = config.groups;

  var aside = document.createElement('aside');
  aside.className = 'page-sidebar';
  aside.setAttribute('aria-label', 'Page navigation');

  var inner = document.createElement('div');
  inner.className = 'page-sidebar-inner';

  var topLinks = document.createElement('div');
  topLinks.className = 'page-sidebar-top';

  (config.topLinks || []).forEach(function (item) {
    topLinks.appendChild(createLink(basePath, item[0], item[1]));
  });

  inner.appendChild(topLinks);

  groups.forEach(function (group) {
    var section = document.createElement('section');
    section.className = 'page-sidebar-group page-sidebar-' + group.key;

    var heading = document.createElement('h2');
    heading.textContent = group.title;
    section.appendChild(heading);

    group.links.forEach(function (item) {
      var href = item[0];
      var label = item[1];
      var link = createLink(basePath, href, label);
      var targetPath = normalizePath((new URL(href, window.location.origin + basePath)).pathname);

      if (targetPath === current) {
        link.classList.add('is-active');
      }

      section.appendChild(link);
    });

    inner.appendChild(section);
  });

  aside.appendChild(inner);
  document.body.appendChild(aside);
  document.body.classList.add('with-page-sidebar');

  // Restore sidebar scroll position from sessionStorage
  var SCROLL_KEY = 'sidebar-scroll';
  var saved = sessionStorage.getItem(SCROLL_KEY);
  if (saved !== null) {
    requestAnimationFrame(function () {
      aside.scrollTop = parseInt(saved, 10);
    });
  }

  // Save sidebar scroll position on scroll
  aside.addEventListener('scroll', function () {
    sessionStorage.setItem(SCROLL_KEY, aside.scrollTop);
  });


})();
