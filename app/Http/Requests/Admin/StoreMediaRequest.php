<?php

namespace App\Http\Requests\Admin;

use App\Models\Media;
use App\Services\Media\MediaService;
use Illuminate\Foundation\Http\FormRequest;

/**
 * Batch upload of the classic form (`files[]`). The library screens upload
 * one file per request through UploadMediaRequest; both share the MIME
 * allow-list and the size cap.
 */
class StoreMediaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can('create', Media::class) ?? false;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * SVG is intentionally excluded: it permits embedded <script> and external resource
     * loads. Re-enable only after introducing a server-side SVG sanitizer (e.g.
     * enshrined/svg-sanitize) and routing all SVG uploads through it.
     *
     * `mimetypes:` validates the actual MIME type detected from file contents rather than
     * just the extension, which closes the spoofed-extension hole that `mimes:` leaves
     * open.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'files' => ['required', 'array', 'min:1', 'max:20'],
            'files.*' => [
                'required',
                'file',
                'max:'.MediaService::MAX_UPLOAD_KILOBYTES,
                'mimetypes:'.implode(',', UploadMediaRequest::MIME_TYPES),
            ],
            // Optional: bind every uploaded file in this batch to a target folder.
            // Null means "drop into root" — consistent with how media rows are stored.
            'folder_id' => ['nullable', 'integer', 'exists:media_folders,id'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'files.required' => 'Выберите файлы для загрузки.',
            'files.array' => 'Выберите файлы для загрузки.',
            'files.min' => 'Выберите файлы для загрузки.',
            'files.max' => 'За один раз можно загрузить не больше 20 файлов.',
            'files.*.required' => 'Выберите файл.',
            'files.*.file' => 'Файл не удалось загрузить.',
            'files.*.uploaded' => 'Файл не удалось загрузить: возможно, он больше допустимого размера.',
            'files.*.mimetypes' => 'Можно загружать JPG, PNG, GIF, WebP, PDF, DOC и DOCX. SVG и исполняемые файлы запрещены.',
            'files.*.max' => 'Файл должен быть не больше 10 МБ.',
            'folder_id.integer' => 'Выберите папку из списка.',
            'folder_id.exists' => 'Выбранная папка не найдена.',
        ];
    }
}
