import Layout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';

export default function Show({}) {
    const { post, locale } = usePage().props;
    console.log(post);
    return (
        <>
            <Head title="Show" />
            <div>{post.tags[0].name}</div>
        </>
    );
}
