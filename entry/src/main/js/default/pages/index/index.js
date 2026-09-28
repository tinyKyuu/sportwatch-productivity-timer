import router from '@system.router';

export default {
    data: {
        todolist: [
            {
                title: '1 min test'
            }
        ]
    },

    pushPage() {
        router.replace({
            uri: 'pages/timer/timer'
        });
    },

    onInit() {
    }
};
