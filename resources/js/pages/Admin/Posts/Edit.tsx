import { PostEditor } from '@/components/posts/post-editor';
import type { PostEditorProps } from '@/components/posts/types';

export default function PostsEdit(props: PostEditorProps) {
    // A fresh editor per post: switching to another post never reuses the form.
    return <PostEditor key={props.post?.id ?? 'new'} {...props} />;
}
