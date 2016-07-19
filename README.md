# majster.js

It's not yet another javascript framework, it's our way how we manage widgets on the website and we decouple code. You don't have to learn new language or special html syntax. Whole logic is keept managed by JS.

Our principle behind this framework:
- simple: we believe JS framework should be simple as possible
- flexible: allow to extend tools to the maximum
- reusable: allow to share functionality with others
- business friendly: require minimum time to learn it, should be easy to maintain and easy to adapt to new and old projects
- DRY: we treat principles really serious, we'd like to decouple code and create minimalistic code for everyone

With this framework you will get:
- dependency injection
- notification - our way for connecting components on the page
- easy solution for form validation
- websocket support
- jQuery power

## How to start?

To use this framework you need import jQuery before. After that you need to add majster.min.js script. Below is hello world sample:

In HTML mark your widget


    <div widget="sample:hello"></div>
 

sample JS

    app.controller('sample:hello', ['$element'], function($element) {
        $element.append('Hello world');
    });

## Wants more?

Check our WIKI page for future documentation or our samples.


