<?php

namespace App\Http\Requests\Admin;

use App\Models\Media;
use Illuminate\Foundation\Http\FormRequest;

/**
 * One file uploaded from an editor: the media picker, a photo dropped or
 * pasted into the text, the library's uploader. Same allow-list as the
 * library's batch upload (StoreMediaRequest) — no SVG, contents-sniffed MIME.
 */
class UploadMediaRequest extends FormRequest
{
    /**
     * @var list<string>
     */
    public const MIME_TYPES = [
        'image/jpeg',
        'image/png',
        'image/gif',
        'image/webp',
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];

    public function authorize(): bool
    {
        return $this->user()?->can('create', Media::class) ?? false;
    }

    /**
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'file' => ['required', 'file', 'max:10240', 'mimetypes:'.implode(',', self::MIME_TYPES)],
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
            'alt' => ['nullable', 'string', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'file.required' => 'Выберите файл.',
            'file.mimetypes' => 'Можно загружать JPG, PNG, GIF, WebP, PDF, DOC и DOCX. SVG и исполняемые файлы запрещены.',
            'file.max' => 'Файл должен быть не больше 10 МБ.',
            'file.uploaded' => 'Файл не удалось загрузить: возможно, он больше допустимого размера.',
        ];
    }
}
